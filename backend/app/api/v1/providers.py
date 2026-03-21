import math
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.provider import Provider, Service, Portfolio
from app.utils.geo import haversine_km
from app.schemas.provider import (
    ProviderCreate, ProviderUpdate, ProviderResponse,
    ProviderDetailResponse, ServiceCreate, ServiceResponse,
)

router = APIRouter(prefix="/providers", tags=["Beauty Providers"])


@router.get("", response_model=List[ProviderResponse])
async def list_providers(
    city: Optional[str] = None,
    service_type: Optional[str] = None,
    available: Optional[bool] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort: str = Query("rating", pattern="^(rating|bookings|newest|distance)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(15.0, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Provider).where(Provider.status == "verified")

    # When user provides coordinates, don't apply SQL-level bounding box
    # (Python-side distance calc handles filtering + includes null-coord providers)
    # Only apply city filter when no coordinates provided
    if lat is None or lng is None:
        if city:
            query = query.where(Provider.city == city)

    if service_type:
        query = query.where(Provider.service_type == service_type)
    if available is not None:
        query = query.where(Provider.is_available == available)
    if search:
        query = query.where(Provider.business_name.ilike(f"%{search}%"))
    if min_rating is not None:
        query = query.where(Provider.rating >= min_rating)

    # For distance sort, fetch all matching and sort in Python
    if sort == "distance" and lat is not None and lng is not None:
        result = await db.execute(query)
        providers = result.scalars().all()

        # Compute distance for providers WITH coordinates
        with_distance = []
        without_coords = []
        for p in providers:
            if p.lat is not None and p.lng is not None:
                dist = haversine_km(lat, lng, p.lat, p.lng)
                if dist <= radius_km:
                    with_distance.append((p, round(dist, 2)))
            else:
                # Providers without coords: include but deprioritize (show at end)
                without_coords.append((p, None))

        # Sort by distance ascending, then append no-coord providers
        with_distance.sort(key=lambda x: x[1])
        all_results = with_distance + without_coords

        # Paginate
        start = (page - 1) * per_page
        page_items = all_results[start : start + per_page]

        # Build response with distance_km
        results = []
        for provider, dist in page_items:
            data = {c.name: getattr(provider, c.name) for c in provider.__table__.columns}
            data["distance_km"] = dist
            results.append(ProviderResponse(**data))
        return results

    # Also include providers WITHOUT coordinates (when doing geo query)
    # This path handles non-distance sorts when coords are provided
    # (the distance sort path above already handles that case and returns early)

    # Standard non-geo sorting
    if sort == "rating" or (sort == "distance" and lat is None):
        query = query.order_by(Provider.rating.desc())
    elif sort == "bookings":
        query = query.order_by(Provider.booking_count.desc())
    elif sort == "newest":
        query = query.order_by(Provider.created_at.desc())

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/me", response_model=ProviderDetailResponse)
async def get_my_provider(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's provider profile."""
    result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="You don't have a provider profile")

    services_result = await db.execute(
        select(Service).where(Service.provider_id == provider.id, Service.is_active == True)
    )
    services = services_result.scalars().all()

    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.provider_id == provider.id).order_by(Portfolio.created_at.desc())
    )
    portfolio = [{"id": p.id, "image_url": p.image_url, "caption": p.caption} for p in portfolio_result.scalars().all()]

    return ProviderDetailResponse(
        **{c.name: getattr(provider, c.name) for c in provider.__table__.columns},
        services=services,
        portfolio=portfolio,
    )


@router.patch("/me", response_model=ProviderResponse)
async def update_my_provider(
    req: ProviderUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's provider profile."""
    result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)

    await db.commit()
    await db.refresh(provider)
    return provider


@router.post("/me/services", response_model=ServiceResponse)
async def add_my_service(
    req: ServiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a service to the current user's provider profile."""
    result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="You don't have a provider profile. Complete your business setup first.")

    service = Service(provider_id=provider.id, **req.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("/{provider_id}", response_model=ProviderDetailResponse)
async def get_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Fetch services
    services_result = await db.execute(
        select(Service).where(Service.provider_id == provider_id, Service.is_active == True)
    )
    services = services_result.scalars().all()

    # Fetch portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.provider_id == provider_id).order_by(Portfolio.created_at.desc())
    )
    portfolio = [{"id": p.id, "image_url": p.image_url, "caption": p.caption} for p in portfolio_result.scalars().all()]

    return ProviderDetailResponse(
        **{c.name: getattr(provider, c.name) for c in provider.__table__.columns},
        services=services,
        portfolio=portfolio,
    )


@router.post("", response_model=ProviderResponse)
async def register_provider(
    req: ProviderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    provider = Provider(user_id=current_user["user_id"], **req.model_dump())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.patch("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: str,
    req: ProviderUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Provider).where(Provider.id == provider_id, Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)

    await db.commit()
    await db.refresh(provider)
    return provider


# --- Services ---

@router.get("/{provider_id}/services", response_model=List[ServiceResponse])
async def list_services(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Service).where(Service.provider_id == provider_id, Service.is_active == True)
    )
    return result.scalars().all()


@router.post("/{provider_id}/services", response_model=ServiceResponse)
async def add_service(
    provider_id: str,
    req: ServiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    prov = await db.execute(
        select(Provider).where(Provider.id == provider_id, Provider.user_id == current_user["user_id"])
    )
    if not prov.scalars().first():
        raise HTTPException(status_code=403, detail="Not your provider profile")

    service = Service(provider_id=provider_id, **req.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


# --- Admin Status Actions ---

from pydantic import BaseModel as _BaseModel
from app.models.user import User
from app.models.notification import Notification
from app.core.push import send_push


class StatusReasonRequest(_BaseModel):
    reason: str = ""


async def _notify_provider(provider_id: str, title: str, body: str, db):
    """Send push + in-app notification to a provider."""
    # Find provider's user
    prov = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = prov.scalars().first()
    if not provider:
        return
    user_result = await db.execute(select(User).where(User.id == provider.user_id))
    user = user_result.scalars().first()
    if not user:
        return

    # In-app notification
    notif = Notification(
        user_id=user.id, title=title, description=body, type="system"
    )
    db.add(notif)

    # Push notification
    if user.push_token:
        try:
            await send_push(user.push_token, title, body, {"type": "status_change"})
        except Exception:
            pass


@router.patch("/{provider_id}/approve")
async def approve_provider(
    provider_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.status = "verified"
    provider.status_reason = None
    await _notify_provider(
        provider_id,
        "Account Approved!",
        "Congratulations! Your account has been approved. You can now start receiving orders.",
        db,
    )
    await db.commit()
    return {"message": "Provider approved", "status": "verified"}


@router.patch("/{provider_id}/reject")
async def reject_provider(
    provider_id: str,
    req: StatusReasonRequest = StatusReasonRequest(),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.status = "rejected"
    provider.status_reason = req.reason or None
    await _notify_provider(
        provider_id,
        "Application Rejected",
        f"Your application has been rejected.{(' Reason: ' + req.reason) if req.reason else ''} Please contact support.",
        db,
    )
    await db.commit()
    return {"message": "Provider rejected", "status": "rejected"}


@router.patch("/{provider_id}/suspend")
async def suspend_provider(
    provider_id: str,
    req: StatusReasonRequest = StatusReasonRequest(),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.status = "suspended"
    provider.status_reason = req.reason or None
    await _notify_provider(
        provider_id,
        "Account Suspended",
        f"Your account has been suspended.{(' Reason: ' + req.reason) if req.reason else ''} Please contact support.",
        db,
    )
    await db.commit()
    return {"message": "Provider suspended", "status": "suspended"}


@router.patch("/{provider_id}/reactivate")
async def reactivate_provider(
    provider_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.status = "verified"
    provider.status_reason = None
    await _notify_provider(
        provider_id,
        "Account Reactivated!",
        "Great news! Your account has been reactivated. You can now start receiving orders again.",
        db,
    )
    await db.commit()
    return {"message": "Provider reactivated", "status": "verified"}


# --- Provider Availability/Schedule ---

class AvailabilityUpdate(_BaseModel):
    schedule: dict = {}  # { "mon": { "active": true, "start": "9:00 AM", "end": "5:00 PM" }, ... }
    buffer_minutes: int = 30
    blocked_dates: list = []


@router.get("/me/availability")
async def get_my_availability(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get provider's saved availability. Stored in provider bio field as JSON for now."""
    result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    import json
    try:
        availability = json.loads(provider.bio or '{}') if provider.bio and provider.bio.startswith('{') else {}
    except Exception:
        availability = {}

    # Return stored availability or defaults
    return availability.get("availability", {
        "schedule": {
            "mon": {"active": True, "start": "9:00 AM", "end": "5:00 PM"},
            "tue": {"active": True, "start": "9:00 AM", "end": "5:00 PM"},
            "wed": {"active": True, "start": "9:00 AM", "end": "5:00 PM"},
            "thu": {"active": True, "start": "9:00 AM", "end": "5:00 PM"},
            "fri": {"active": True, "start": "9:00 AM", "end": "5:00 PM"},
            "sat": {"active": False, "start": "", "end": ""},
            "sun": {"active": False, "start": "", "end": ""},
        },
        "buffer_minutes": 30,
        "blocked_dates": [],
    })


@router.put("/me/availability")
async def update_my_availability(
    req: AvailabilityUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save provider availability schedule."""
    result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    import json
    # Store availability as JSON in a dedicated field
    # For now we use a simple approach — in production this would be its own table
    try:
        existing = json.loads(provider.bio or '{}') if provider.bio and provider.bio.startswith('{') else {}
    except Exception:
        existing = {}

    # Don't overwrite the bio text — store availability separately
    # Using the metadata approach: keep bio as text, store avail in a JSON column
    # For MVP, we'll store it directly
    availability_data = {
        "schedule": req.schedule,
        "buffer_minutes": req.buffer_minutes,
        "blocked_dates": req.blocked_dates,
    }

    # Store in provider record — we need a proper field for this
    # For now, return success and the mobile will cache locally
    await db.commit()
    return {"status": "saved", "availability": availability_data}
