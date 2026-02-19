from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.provider import Provider, Service, Portfolio
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
    sort: str = Query("rating", pattern="^(rating|bookings|newest)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Provider).where(Provider.status == "verified")

    if city:
        query = query.where(Provider.city == city)
    if service_type:
        query = query.where(Provider.service_type == service_type)
    if available is not None:
        query = query.where(Provider.is_available == available)
    if search:
        query = query.where(Provider.business_name.ilike(f"%{search}%"))

    if sort == "rating":
        query = query.order_by(Provider.rating.desc())
    elif sort == "bookings":
        query = query.order_by(Provider.booking_count.desc())
    elif sort == "newest":
        query = query.order_by(Provider.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


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
