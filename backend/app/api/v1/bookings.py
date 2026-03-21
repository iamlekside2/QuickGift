import random
import string
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.config import settings
from app.core.push import send_push
from app.models.booking import Booking
from app.models.provider import Provider, Service
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter(prefix="/bookings", tags=["Beauty Bookings"])


def generate_booking_number():
    return "QB-" + "".join(random.choices(string.digits, k=4))


@router.post("", response_model=BookingResponse)
async def create_booking(
    req: BookingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify provider exists
    provider_result = await db.execute(select(Provider).where(Provider.id == req.provider_id))
    provider = provider_result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if not provider.is_available:
        raise HTTPException(status_code=400, detail="Provider is currently unavailable")

    # Verify service exists
    service_result = await db.execute(
        select(Service).where(Service.id == req.service_id, Service.provider_id == req.provider_id)
    )
    service = service_result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    deposit = service.price  # Full payment collected upfront
    commission = service.price * (settings.BEAUTY_COMMISSION_PERCENT / 100)

    booking = Booking(
        booking_number=generate_booking_number(),
        user_id=current_user["user_id"],
        provider_id=req.provider_id,
        service_id=req.service_id,
        service_name=service.name,
        service_type=req.service_type,
        booking_date=req.booking_date,
        booking_time=req.booking_time,
        duration_minutes=service.duration_minutes,
        price=service.price,
        deposit=deposit,
        commission=commission,
        address=req.address,
        notes=req.notes,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Push notification to provider
    buyer_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    buyer = buyer_result.scalars().first()
    provider_user_result = await db.execute(select(User).where(User.id == provider.user_id))
    provider_user = provider_user_result.scalars().first()
    if provider_user and provider_user.push_token:
        buyer_name = buyer.full_name if buyer else "A customer"
        await send_push(
            provider_user.push_token,
            "New Booking Request",
            f"{buyer_name} booked {service.name}",
            {"type": "booking", "booking_id": booking.id},
        )

    return booking


@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[str] = None,
    date: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") == "provider":
        # Look up Provider record by user_id to get the provider's id
        provider_result = await db.execute(
            select(Provider).where(Provider.user_id == current_user["user_id"])
        )
        provider = provider_result.scalars().first()
        if not provider:
            raise HTTPException(status_code=404, detail="Provider profile not found")
        query = select(Booking).where(Booking.provider_id == provider.id)
    else:
        query = select(Booking).where(Booking.user_id == current_user["user_id"])

    if status:
        query = query.where(Booking.status == status)
    if date:
        # Filter by booking_date (date string like "2026-03-21")
        from sqlalchemy import cast, Date
        try:
            query = query.where(cast(Booking.booking_date, Date) == date)
        except Exception:
            pass

    query = query.order_by(Booking.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return booking


@router.patch("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    req: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only the provider associated with this booking can update status
    provider_result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = provider_result.scalars().first()
    if not provider or provider.id != booking.provider_id:
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only the assigned provider can update booking status")

    valid_transitions = {
        "pending": ["accepted", "confirmed", "declined", "cancelled"],
        "accepted": ["in_progress", "cancelled"],
        "confirmed": ["in_progress", "cancelled"],
        "in_progress": ["completed"],
        "completed": [],
        "declined": [],
        "cancelled": [],
    }

    if req.status not in valid_transitions.get(booking.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {booking.status} to {req.status}",
        )

    booking.status = req.status
    await db.commit()
    await db.refresh(booking)

    # Push notification to buyer about status change
    buyer_result = await db.execute(select(User).where(User.id == booking.user_id))
    buyer = buyer_result.scalars().first()
    if buyer and buyer.push_token:
        status_label = req.status.replace("_", " ").title()
        await send_push(
            buyer.push_token,
            f"Booking {status_label}",
            f"Your booking for {booking.service_name} has been {status_label.lower()}",
            {"type": "booking_status", "booking_id": booking.id, "status": req.status},
        )

    return booking
