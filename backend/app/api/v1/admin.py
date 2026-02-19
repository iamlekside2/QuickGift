from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.order import Order
from app.models.booking import Booking
from app.models.product import Product
from app.models.provider import Provider
from app.models.payment import Payment

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def dashboard_stats(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Total revenue
    order_revenue = (await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.payment_status == "paid")
    )).scalar()

    booking_revenue = (await db.execute(
        select(func.coalesce(func.sum(Booking.price), 0)).where(Booking.payment_status == "paid")
    )).scalar()

    # Counts
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar()
    total_bookings = (await db.execute(select(func.count(Booking.id)))).scalar()
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_providers = (await db.execute(select(func.count(Provider.id)))).scalar()
    total_products = (await db.execute(select(func.count(Product.id)))).scalar()

    # Pending items
    pending_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status == "pending")
    )).scalar()
    pending_providers = (await db.execute(
        select(func.count(Provider.id)).where(Provider.status == "pending")
    )).scalar()

    # Commission earned
    order_commission = (await db.execute(
        select(func.coalesce(func.sum(Order.commission), 0)).where(Order.payment_status == "paid")
    )).scalar()
    booking_commission = (await db.execute(
        select(func.coalesce(func.sum(Booking.commission), 0)).where(Booking.payment_status == "paid")
    )).scalar()

    return {
        "revenue": {
            "total": order_revenue + booking_revenue,
            "gifts": order_revenue,
            "beauty": booking_revenue,
        },
        "commission": {
            "total": order_commission + booking_commission,
            "gifts": order_commission,
            "beauty": booking_commission,
        },
        "counts": {
            "orders": total_orders,
            "bookings": total_bookings,
            "users": total_users,
            "providers": total_providers,
            "products": total_products,
        },
        "pending": {
            "orders": pending_orders,
            "providers": pending_providers,
        },
    }


@router.get("/orders")
async def admin_list_orders(
    status: str = None,
    order_type: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)

    if status:
        query = query.where(Order.status == status)
    if order_type:
        query = query.where(Order.order_type == order_type)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()

    query = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    orders = result.scalars().all()

    return {"items": orders, "total": total, "page": page, "per_page": per_page}


@router.get("/users")
async def admin_list_users(
    search: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)

    if search:
        query = query.where(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%") | User.phone.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()

    query = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()

    return {"items": users, "total": total, "page": page, "per_page": per_page}


@router.get("/providers")
async def admin_list_providers(
    status: str = None,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Provider)

    if status:
        query = query.where(Provider.status == status)

    query = query.order_by(Provider.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/bookings")
async def admin_list_bookings(
    status: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking)

    if status:
        query = query.where(Booking.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()

    query = query.order_by(Booking.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    bookings = result.scalars().all()

    return {"items": bookings, "total": total, "page": page, "per_page": per_page}
