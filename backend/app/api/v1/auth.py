from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    generate_otp, get_current_user,
)
from app.core.config import settings
from app.core.sms import send_otp_sms
from app.models.user import User, OTP
from app.models.provider import Provider
from pydantic import BaseModel
from app.schemas.auth import (
    SendOTPRequest, VerifyOTPRequest, RegisterRequest,
    LoginRequest, TokenResponse, UserResponse, UpdateProfileRequest,
)
from app.utils.helpers import validate_nigerian_phone


class PushTokenRequest(BaseModel):
    token: str

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/check-phone")
async def check_phone(req: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    """Check if a phone number is already registered."""
    if not validate_nigerian_phone(req.phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number. Please use a valid Nigerian number (e.g. +2348012345678, 08012345678).",
        )

    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalars().first()
    exists = user is not None and user.full_name != "QuickGift User"
    return {"exists": exists}


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    if not validate_nigerian_phone(req.phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number. Please use a valid Nigerian number (e.g. +2348012345678, 08012345678).",
        )

    # Rate limit: max 5 OTPs per phone in 10 minutes
    from sqlalchemy import func
    recent_count = await db.scalar(
        select(func.count(OTP.id)).where(
            OTP.phone == req.phone,
            OTP.created_at >= datetime.utcnow() - timedelta(minutes=10),
        )
    )
    if (recent_count or 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a few minutes.")

    code = generate_otp()
    otp = OTP(
        phone=req.phone,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    await db.commit()

    # Send OTP via Termii SMS
    sms_sent = await send_otp_sms(req.phone, code)

    response = {"message": "OTP sent successfully"}

    # Only expose OTP in DEBUG mode — never in production even if SMS fails
    if settings.DEBUG:
        response["otp_dev"] = code

    return response


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OTP)
        .where(OTP.phone == req.phone, OTP.code == req.code, OTP.is_used == False)
        .order_by(OTP.created_at.desc())
    )
    otp = result.scalars().first()

    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.is_used = True

    # Find existing user
    user_result = await db.execute(select(User).where(User.phone == req.phone))
    user = user_result.scalars().first()
    is_new = False

    if user and not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")

    if not user:
        # Auto-create a basic user account for OTP login
        user = User(phone=req.phone, full_name="QuickGift User")
        db.add(user)
        is_new = True

    await db.commit()
    await db.refresh(user)

    # Check if provider has completed profile
    profile_complete = True
    if user.role == "provider":
        prov_result = await db.execute(select(Provider).where(Provider.user_id == user.id))
        profile_complete = prov_result.scalars().first() is not None

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
            "city": user.city,
            "wallet_balance": user.wallet_balance,
            "is_new_user": is_new,
            "profile_complete": profile_complete,
        },
    )


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not validate_nigerian_phone(req.phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number. Please use a valid Nigerian number (e.g. +2348012345678, 08012345678).",
        )

    # Verify OTP first
    otp_result = await db.execute(
        select(OTP)
        .where(OTP.phone == req.phone, OTP.code == req.otp, OTP.is_used == False)
        .order_by(OTP.created_at.desc())
    )
    otp = otp_result.scalars().first()

    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.is_used = True

    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == req.phone))
    existing_user = existing.scalars().first()

    if existing_user:
        # If user was auto-created by verify-otp (placeholder name), allow profile update
        # Otherwise, this is an already-registered user — reject
        if existing_user.full_name != "QuickGift User":
            raise HTTPException(
                status_code=400,
                detail="This phone number is already registered. Please log in instead."
            )

        # Update the auto-created placeholder user
        existing_user.full_name = req.full_name
        if req.email:
            existing_user.email = req.email
        if req.password:
            existing_user.password_hash = hash_password(req.password)
        if req.city:
            existing_user.city = req.city

        allowed_roles = ("user", "provider")
        existing_user.role = req.role if req.role in allowed_roles else "user"

        await db.commit()
        await db.refresh(existing_user)
        user = existing_user
    else:
        if req.email:
            email_exists = await db.execute(select(User).where(User.email == req.email))
            if email_exists.scalars().first():
                raise HTTPException(status_code=400, detail="Email already registered")

        # Validate role
        allowed_roles = ("user", "provider")
        role = req.role if req.role in allowed_roles else "user"

        user = User(
            full_name=req.full_name,
            phone=req.phone,
            email=req.email,
            password_hash=hash_password(req.password) if req.password else None,
            city=req.city,
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Check if provider has completed profile
    profile_complete = True
    if user.role == "provider":
        prov_result = await db.execute(select(Provider).where(Provider.user_id == user.id))
        profile_complete = prov_result.scalars().first() is not None

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
            "city": user.city,
            "wallet_balance": user.wallet_balance,
            "profile_complete": profile_complete,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Support login by phone OR email
    identifier = req.phone or req.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Phone or email is required")
    result = await db.execute(
        select(User).where((User.phone == identifier) | (User.email == identifier))
    )
    user = result.scalars().first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    # Check if provider has completed profile
    profile_complete = True
    if user.role == "provider":
        prov_result = await db.execute(select(Provider).where(Provider.user_id == user.id))
        profile_complete = prov_result.scalars().first() is not None

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
            "city": user.city,
            "wallet_balance": user.wallet_balance,
            "profile_complete": profile_complete,
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/push-token")
async def register_push_token(
    req: PushTokenRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register an Expo push notification token for the authenticated user."""
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.push_token = req.token
    await db.commit()
    return {"message": "Push token registered"}
