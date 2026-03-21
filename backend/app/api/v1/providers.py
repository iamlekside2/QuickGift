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
    sort: str = Query("rating", pattern="^(rating|bookings|newest|distance)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(15.0, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Provider).where(Provider.status == "verified")

    # When user provides coordinates, use bounding-box pre-filter instead of city text
    if lat is not None and lng is not None:
        delta_lat = radius_km / 111.0
        delta_lng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))
        query = query.where(
            Provider.lat.isnot(None),
            Provider.lng.isnot(None),
            Provider.lat.between(lat - delta_lat, lat + delta_lat),
            Provider.lng.between(lng - delta_lng, lng + delta_lng),
        )
    elif city:
        query = query.where(Provider.city == city)

    if service_type:
        query = query.where(Provider.service_type == service_type)
    if available is not None:
        query = query.where(Provider.is_available == available)
    if search:
        query = query.where(Provider.business_name.ilike(f"%{search}%"))

    # For distance sort, fetch all matching and sort in Python
    if sort == "distance" and lat is not None and lng is not None:
        result = await db.execute(query)
        providers = result.scalars().all()

        # Compute distance and filter by radius
        with_distance = []
        for p in providers:
            if p.lat is not None and p.lng is not None:
                dist = haversine_km(lat, lng, p.lat, p.lng)
                if dist <= radius_km:
                    with_distance.append((p, round(dist, 1)))

        # Sort by distance ascending
        with_distance.sort(key=lambda x: x[1])

        # Paginate
        start = (page - 1) * per_page
        page_items = with_distance[start : start + per_page]

        # Build response with distance_km
        results = []
        for provider, dist in page_items:
            data = {c.name: getattr(provider, c.name) for c in provider.__table__.columns}
            data["distance_km"] = dist
            results.append(ProviderResponse(**data))
        return results

    # Also include providers WITHOUT coordinates (when doing geo query)
    # They go in a separate query and are appended at the end
    if lat is not None and lng is not None:
        # We already filtered for providers WITH coords above.
        # Also fetch providers without coords (same filters minus geo)
        no_geo_query = select(Provider).where(
            Provider.status == "verified",
            (Provider.lat.is_(None)) | (Provider.lng.is_(None)),
        )
        if service_type:
            no_geo_query = no_geo_query.where(Provider.service_type == service_type)
        if available is not None:
            no_geo_query = no_geo_query.where(Provider.is_available == available)
        if search:
            no_geo_query = no_geo_query.where(Provider.business_name.ilike(f"%{search}%"))

        # Get geo results with distance
        geo_result = await db.execute(query)
        geo_providers = geo_result.scalars().all()
        with_distance = []
        for p in geo_providers:
            dist = haversine_km(lat, lng, p.lat, p.lng)
            if dist <= radius_km:
                with_distance.append((p, round(dist, 1)))
        with_distance.sort(key=lambda x: x[1])

        # Get non-geo results
        no_geo_result = await db.execute(no_geo_query.order_by(Provider.rating.desc()))
        no_geo_providers = no_geo_result.scalars().all()

        # Combine: geo-sorted first, then non-geo
        all_items = [(p, d) for p, d in with_distance] + [(p, None) for p in no_geo_providers]

        # Paginate
        start = (page - 1) * per_page
        page_items = all_items[start : start + per_page]

        results = []
        for provider, dist in page_items:
            data = {c.name: getattr(provider, c.name) for c in provider.__table__.columns}
            data["distance_km"] = dist
            results.append(ProviderResponse(**data))
        return results

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


# --- Admin ---

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
    await db.commit()
    return {"message": "Provider approved"}


@router.patch("/{provider_id}/reject")
async def reject_provider(
    provider_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.status = "suspended"
    await db.commit()
    return {"message": "Provider rejected"}
