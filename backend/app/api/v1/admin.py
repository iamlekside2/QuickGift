import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.security import require_admin, hash_password
from app.models.user import User
from app.models.order import Order
from app.models.booking import Booking
from app.models.product import Product, Category, Occasion
from app.models.provider import Provider, Service
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.payout import Payout
from app.models.delivery import Delivery

router = APIRouter(prefix="/admin", tags=["Admin"])


def _id():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

SEED_CATEGORIES = [
    {"name": "Cakes & Desserts",    "icon": "🎂", "description": "Birthday, wedding & celebration cakes",  "sort_order": 1},
    {"name": "Flowers",             "icon": "💐", "description": "Fresh bouquets & arrangements",          "sort_order": 2},
    {"name": "Chocolates & Snacks", "icon": "🍫", "description": "Premium chocolate & snack gift boxes",   "sort_order": 3},
    {"name": "Gift Hampers",        "icon": "🧺", "description": "Curated gift hampers for every occasion","sort_order": 4},
    {"name": "Balloons & Cards",    "icon": "🎈", "description": "Balloon bouquets, arches & greeting cards","sort_order": 5},
    {"name": "Personalized",        "icon": "✨", "description": "Custom mugs, frames & engraved gifts",   "sort_order": 6},
]

SEED_OCCASIONS = [
    {"name": "Birthday",     "icon": "🎂", "color": "#35615D", "sort_order": 1},
    {"name": "Anniversary",  "icon": "💝", "color": "#2A4E4B", "sort_order": 2},
    {"name": "Wedding",      "icon": "💒", "color": "#FD8950", "sort_order": 3},
    {"name": "Graduation",   "icon": "🎓", "color": "#10B981", "sort_order": 4},
    {"name": "Apology",      "icon": "🙏", "color": "#6366F1", "sort_order": 5},
    {"name": "Get Well",     "icon": "💐", "color": "#F59E0B", "sort_order": 6},
    {"name": "Just Because", "icon": "🎁", "color": "#EC4899", "sort_order": 7},
    {"name": "Christmas",    "icon": "🎄", "color": "#059669", "sort_order": 8},
    {"name": "Eid",          "icon": "🌙", "color": "#7C3AED", "sort_order": 9},
    {"name": "Valentine's",  "icon": "❤️", "color": "#DC2626", "sort_order": 10},
]

SEED_PRODUCTS = [
    {"name": "Red Velvet Cake", "description": "Three-layer red velvet cake with cream cheese frosting.", "price": 15000, "compare_price": 18000, "category_key": "Cakes & Desserts", "vendor_name": "Sweet Treats Lagos", "rating": 4.8, "review_count": 124, "is_featured": True, "city": "Lagos", "tags": '["birthday","anniversary"]'},
    {"name": "Rose Bouquet Premium", "description": "24 premium long-stem red roses in luxury packaging.", "price": 25000, "compare_price": 30000, "category_key": "Flowers", "vendor_name": "Bloom Nigeria", "rating": 4.9, "review_count": 89, "is_featured": True, "city": "Lagos", "tags": '["romance","valentine"]'},
    {"name": "Luxury Chocolate Box", "description": "Assorted Belgian chocolates in an elegant gift box (24 pieces).", "price": 8500, "compare_price": 10000, "category_key": "Chocolates & Snacks", "vendor_name": "ChocoLux", "rating": 4.7, "review_count": 56, "is_featured": True, "city": "Lagos", "tags": '["chocolate","luxury"]'},
    {"name": "Birthday Hamper Deluxe", "description": "Premium hamper with wine, chocolates, scented candles.", "price": 35000, "compare_price": 42000, "category_key": "Gift Hampers", "vendor_name": "GiftBox NG", "rating": 4.9, "review_count": 201, "is_featured": True, "city": "Lagos", "tags": '["birthday","hamper"]'},
    {"name": "Custom Photo Mug", "description": "High-quality ceramic mug with your favourite photo.", "price": 5000, "compare_price": 6500, "category_key": "Personalized", "vendor_name": "PrintHub", "rating": 4.5, "review_count": 78, "is_featured": True, "city": "Lagos", "tags": '["personalized","mug"]'},
    {"name": "Balloon Arch Set", "description": "Complete balloon arch kit with 60 balloons and pump.", "price": 12000, "compare_price": 15000, "category_key": "Balloons & Cards", "vendor_name": "Party Central", "rating": 4.6, "review_count": 42, "is_featured": True, "city": "Lagos", "tags": '["party","decoration"]'},
    {"name": "Vanilla Birthday Cake", "description": "Classic vanilla sponge with buttercream. Serves 10-12.", "price": 12000, "compare_price": 14000, "category_key": "Cakes & Desserts", "vendor_name": "Sweet Treats Lagos", "rating": 4.6, "review_count": 95, "is_featured": False, "city": "Lagos", "tags": '["birthday","vanilla"]'},
    {"name": "Mixed Flower Bouquet", "description": "Seasonal mix of roses, lilies, and chrysanthemums.", "price": 18000, "compare_price": 22000, "category_key": "Flowers", "vendor_name": "Bloom Nigeria", "rating": 4.7, "review_count": 67, "is_featured": False, "city": "Lagos", "tags": '["flowers","mixed"]'},
    {"name": "Anniversary Hamper", "description": "Champagne, gourmet treats, candles, and a keepsake box.", "price": 42000, "compare_price": 50000, "category_key": "Gift Hampers", "vendor_name": "GiftBox NG", "rating": 4.8, "review_count": 134, "is_featured": False, "city": "Lagos", "tags": '["anniversary","hamper"]'},
    {"name": "Assorted Truffles Box", "description": "Hand-rolled truffles in dark, milk, and white chocolate.", "price": 8500, "compare_price": 10000, "category_key": "Chocolates & Snacks", "vendor_name": "ChocoLux", "rating": 4.6, "review_count": 44, "is_featured": False, "city": "Lagos", "tags": '["chocolate","truffle"]'},
    {"name": "Helium Balloon Set (12)", "description": "12 pre-inflated helium balloons with ribbons.", "price": 10000, "compare_price": 12000, "category_key": "Balloons & Cards", "vendor_name": "Party Central", "rating": 4.4, "review_count": 38, "is_featured": False, "city": "Lagos", "tags": '["helium","balloon"]'},
    {"name": "Engraved Wooden Frame", "description": "Handcrafted wooden frame with laser engraving. 5x7.", "price": 7500, "compare_price": 9000, "category_key": "Personalized", "vendor_name": "PrintHub", "rating": 4.3, "review_count": 31, "is_featured": False, "city": "Lagos", "tags": '["personalized","frame"]'},
]

SEED_PROVIDERS = [
    {
        "user": {"full_name": "Amara Okonkwo", "phone": "+2348101000001", "email": "amara@quickgift.ng", "city": "Lagos", "role": "provider"},
        "provider": {"business_name": "Amara Nails", "service_type": "Nail Tech", "bio": "Certified nail technician. Gel extensions, nail art, luxury manicures. 5+ years.", "location": "Lekki, Lagos", "city": "Lagos", "lat": 6.4478, "lng": 3.4723, "rating": 4.8, "review_count": 230, "booking_count": 412, "experience_years": 5, "status": "verified"},
        "services": [{"name": "Gel Manicure", "description": "Full gel manicure with nail art.", "price": 5000, "duration_minutes": 60}, {"name": "Acrylic Full Set", "description": "Full set acrylic nails.", "price": 12000, "duration_minutes": 90}, {"name": "Luxury Pedicure", "description": "Spa pedicure with gel polish.", "price": 7000, "duration_minutes": 75}],
    },
    {
        "user": {"full_name": "Bimpe Adeyemi", "phone": "+2348101000002", "email": "bimpe@quickgift.ng", "city": "Lagos", "role": "provider"},
        "provider": {"business_name": "Bimpe Hair Studio", "service_type": "Hair Styling", "bio": "Expert braider and hair stylist. Protective styles, silk press, bridal hair.", "location": "Ikeja, Lagos", "city": "Lagos", "lat": 6.6018, "lng": 3.3515, "rating": 4.7, "review_count": 189, "booking_count": 340, "experience_years": 7, "status": "verified"},
        "services": [{"name": "Box Braids (Mid-length)", "description": "Knotless box braids.", "price": 15000, "duration_minutes": 180}, {"name": "Silk Press", "description": "Silk press blowout.", "price": 8000, "duration_minutes": 90}, {"name": "Bridal Updo", "description": "Elegant bridal updo.", "price": 25000, "duration_minutes": 120}],
    },
    {
        "user": {"full_name": "Tolu Bakare", "phone": "+2348101000003", "email": "tolu@quickgift.ng", "city": "Lagos", "role": "provider"},
        "provider": {"business_name": "Tolu MUA", "service_type": "Makeup", "bio": "Professional MUA for weddings, editorials, everyday glam.", "location": "Victoria Island, Lagos", "city": "Lagos", "lat": 6.4281, "lng": 3.4219, "rating": 4.9, "review_count": 310, "booking_count": 520, "experience_years": 8, "status": "verified"},
        "services": [{"name": "Full Glam Makeup", "description": "Full face beat for events.", "price": 25000, "duration_minutes": 90}, {"name": "Bridal Makeup", "description": "Complete bridal package.", "price": 50000, "duration_minutes": 120}, {"name": "Natural Everyday Look", "description": "Soft glam for everyday.", "price": 15000, "duration_minutes": 60}],
    },
    {
        "user": {"full_name": "Emeka Chukwu", "phone": "+2348101000004", "email": "emeka@quickgift.ng", "city": "Abuja", "role": "provider"},
        "provider": {"business_name": "Fresh Cuts Abuja", "service_type": "Barber", "bio": "Premium barbershop. Clean fades, beard grooming, hot towel shaves.", "location": "Wuse, Abuja", "city": "Abuja", "lat": 9.0579, "lng": 7.4951, "rating": 4.6, "review_count": 156, "booking_count": 280, "experience_years": 6, "status": "verified"},
        "services": [{"name": "Skin Fade", "description": "Clean skin fade with line up.", "price": 3000, "duration_minutes": 45}, {"name": "Beard Trim & Shape", "description": "Precision beard trim.", "price": 2000, "duration_minutes": 30}, {"name": "Full Grooming Package", "description": "Haircut, beard trim, hot towel shave.", "price": 5000, "duration_minutes": 75}],
    },
]


@router.post("/seed")
async def seed_database(
    secret: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Seed database with initial data. Protected by SECRET_KEY."""
    if secret != settings.SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid secret")

    results = []

    # Admin user
    existing = await db.execute(select(User).where(User.email == "admin@quickgift.ng"))
    if not existing.scalars().first():
        db.add(User(id=_id(), full_name="QuickGift Admin", phone="+2348000000000", email="admin@quickgift.ng", password_hash=hash_password("admin123"), role="admin", city="Lagos", is_active=True))
        await db.flush()
        results.append("Admin user created")
    else:
        results.append("Admin user: already exists")

    # Categories
    cat_count = await db.scalar(select(func.count()).select_from(Category))
    cat_map = {}
    if not cat_count or cat_count == 0:
        for cat in SEED_CATEGORIES:
            cid = _id()
            db.add(Category(id=cid, **cat))
            cat_map[cat["name"]] = cid
        await db.flush()
        results.append(f"Categories: seeded {len(SEED_CATEGORIES)}")
    else:
        result = await db.execute(select(Category))
        cat_map = {c.name: c.id for c in result.scalars().all()}
        results.append(f"Categories: already has {cat_count}")

    # Occasions
    occ_count = await db.scalar(select(func.count()).select_from(Occasion))
    if not occ_count or occ_count == 0:
        for occ in SEED_OCCASIONS:
            db.add(Occasion(id=_id(), **occ))
        await db.flush()
        results.append(f"Occasions: seeded {len(SEED_OCCASIONS)}")
    else:
        results.append(f"Occasions: already has {occ_count}")

    # Products
    prod_count = await db.scalar(select(func.count()).select_from(Product))
    if not prod_count or prod_count == 0:
        for prod in SEED_PRODUCTS:
            data = {k: v for k, v in prod.items() if k != "category_key"}
            data["id"] = _id()
            data["status"] = "active"
            data["category_id"] = cat_map.get(prod["category_key"], "")
            db.add(Product(**data))
        await db.flush()
        results.append(f"Products: seeded {len(SEED_PRODUCTS)}")
    else:
        results.append(f"Products: already has {prod_count}")

    # Providers
    prov_count = await db.scalar(select(func.count()).select_from(Provider))
    if not prov_count or prov_count == 0:
        for entry in SEED_PROVIDERS:
            uid = _id()
            db.add(User(id=uid, **entry["user"], is_active=True, password_hash=hash_password("provider123")))
            pid = _id()
            db.add(Provider(id=pid, user_id=uid, **entry["provider"]))
            for svc in entry["services"]:
                db.add(Service(id=_id(), provider_id=pid, **svc))
        await db.flush()
        results.append(f"Providers: seeded {len(SEED_PROVIDERS)} with services")
    else:
        results.append(f"Providers: already has {prov_count}")

    await db.commit()
    return {"status": "ok", "results": results}


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
    pending_bookings = (await db.execute(
        select(func.count(Booking.id)).where(Booking.status == "pending")
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
            "bookings": pending_bookings,
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

    # Strip password_hash from response
    safe_users = []
    for u in users:
        d = {c.name: getattr(u, c.name) for c in u.__table__.columns if c.name != 'password_hash'}
        safe_users.append(d)

    return {"items": safe_users, "total": total, "page": page, "per_page": per_page}


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


# ---------------------------------------------------------------------------
# Payments (Admin)
# ---------------------------------------------------------------------------

@router.get("/payments")
async def admin_list_payments(
    status: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Payment)
    if status:
        query = query.where(Payment.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Payment.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    payments = result.scalars().all()

    return {"items": payments, "total": total, "page": page, "per_page": per_page}


# ---------------------------------------------------------------------------
# Transactions (Admin)
# ---------------------------------------------------------------------------

@router.get("/transactions")
async def admin_list_transactions(
    type: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction)
    if type:
        query = query.where(Transaction.type == type)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Transaction.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    txns = result.scalars().all()

    return {"items": txns, "total": total, "page": page, "per_page": per_page}


# ---------------------------------------------------------------------------
# Payouts (Admin)
# ---------------------------------------------------------------------------

@router.get("/payouts")
async def admin_list_payouts(
    status: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Payout)
    if status:
        query = query.where(Payout.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Payout.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    payouts = result.scalars().all()

    return {"items": payouts, "total": total, "page": page, "per_page": per_page}


@router.patch("/payouts/{payout_id}/release")
async def release_payout(
    payout_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Manually release a held payout to the provider's wallet."""
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    if payout.status not in ("held", "released"):
        raise HTTPException(status_code=400, detail=f"Cannot release payout in '{payout.status}' status")

    # Credit provider's wallet
    provider_result = await db.execute(select(Provider).where(Provider.id == payout.provider_id))
    provider = provider_result.scalars().first()

    if provider:
        user_result = await db.execute(select(User).where(User.id == provider.user_id))
        provider_user = user_result.scalars().first()
        if provider_user:
            provider_user.wallet_balance += payout.amount

            # Record transaction
            ref = f"PO-{uuid.uuid4().hex[:12].upper()}"
            tx = Transaction(
                user_id=provider_user.id,
                type="credit",
                amount=payout.amount,
                description=f"Payout for {'order' if payout.order_id else 'booking'} {payout.order_id or payout.booking_id}",
                reference=ref,
                balance_after=provider_user.wallet_balance,
                status="completed",
            )
            db.add(tx)

            # Update provider revenue
            provider.total_revenue += payout.amount

    payout.status = "paid"
    payout.paid_at = datetime.utcnow()

    # Notify provider about payout
    from app.core.notify import notify_user
    if provider:
        await notify_user(
            provider.user_id,
            "Payment Received!",
            f"₦{payout.amount:,.0f} has been credited to your wallet.",
            "payment",
            {"type": "payout_received", "payout_id": payout_id},
            db,
        )

    await db.commit()

    return {"status": "ok", "payout_id": payout_id, "amount": payout.amount}


@router.patch("/payouts/{payout_id}/cancel")
async def cancel_payout(
    payout_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a payout (e.g. for refunded orders)."""
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    if payout.status == "paid":
        raise HTTPException(status_code=400, detail="Cannot cancel an already paid payout")

    payout.status = "cancelled"
    await db.commit()

    return {"status": "ok", "payout_id": payout_id}


@router.get("/payouts/stats")
async def payout_stats(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get payout statistics."""
    total_held = (await db.execute(
        select(func.coalesce(func.sum(Payout.amount), 0)).where(Payout.status == "held")
    )).scalar()
    total_released = (await db.execute(
        select(func.coalesce(func.sum(Payout.amount), 0)).where(Payout.status == "released")
    )).scalar()
    total_paid = (await db.execute(
        select(func.coalesce(func.sum(Payout.amount), 0)).where(Payout.status == "paid")
    )).scalar()
    total_commission = (await db.execute(
        select(func.coalesce(func.sum(Payout.commission), 0)).where(Payout.status.in_(["held", "released", "paid"]))
    )).scalar()
    pending_count = (await db.execute(
        select(func.count(Payout.id)).where(Payout.status.in_(["held", "released"]))
    )).scalar()

    return {
        "held": total_held,
        "released": total_released,
        "paid": total_paid,
        "total_commission": total_commission,
        "pending_count": pending_count,
    }


# ---------------------------------------------------------------------------
# Deliveries (Admin)
# ---------------------------------------------------------------------------

@router.get("/deliveries")
async def admin_list_deliveries(
    status: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Delivery)
    if status:
        query = query.where(Delivery.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Delivery.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    deliveries = result.scalars().all()

    return {"items": deliveries, "total": total, "page": page, "per_page": per_page}


# ---------------------------------------------------------------------------
# Settings (Admin)
# ---------------------------------------------------------------------------

@router.get("/settings")
async def get_settings(admin: dict = Depends(require_admin)):
    """Get current platform settings from env/config."""
    return {
        "gift_commission": settings.GIFT_COMMISSION_PERCENT,
        "beauty_commission": settings.BEAUTY_COMMISSION_PERCENT,
        "paystack_live": settings.PAYSTACK_LIVE,
        "kwik_env": getattr(settings, 'KWIK_ENV', 'test'),
        "payout_hold_hours": settings.PAYOUT_HOLD_HOURS,
    }


# ---------------------------------------------------------------------------
# Revenue analytics (Admin)
# ---------------------------------------------------------------------------

@router.get("/analytics/revenue")
async def revenue_analytics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get revenue data grouped by day for the last 7 days."""
    from sqlalchemy import text
    rows = []
    for i in range(6, -1, -1):
        day_label = (datetime.utcnow() - __import__('datetime').timedelta(days=i)).strftime('%a')
        day_start = (datetime.utcnow() - __import__('datetime').timedelta(days=i)).replace(hour=0, minute=0, second=0)
        day_end = day_start + __import__('datetime').timedelta(days=1)

        gift_rev = (await db.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.payment_status == "paid",
                Order.created_at >= day_start,
                Order.created_at < day_end,
            )
        )).scalar()

        beauty_rev = (await db.execute(
            select(func.coalesce(func.sum(Booking.price), 0)).where(
                Booking.payment_status == "paid",
                Booking.created_at >= day_start,
                Booking.created_at < day_end,
            )
        )).scalar()

        rows.append({"name": day_label, "gifts": gift_rev, "beauty": beauty_rev})

    return rows


# ---------------------------------------------------------------------------
# Withdrawal Processing (Admin)
# ---------------------------------------------------------------------------

@router.get("/withdrawals")
async def admin_list_withdrawals(
    status: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all withdrawal transactions."""
    query = select(Transaction).where(Transaction.description.like("%Withdrawal%"))
    if status:
        query = query.where(Transaction.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Transaction.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)

    return {"items": result.scalars().all(), "total": total, "page": page, "per_page": per_page}


@router.patch("/withdrawals/{transaction_id}/complete")
async def complete_withdrawal(
    transaction_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark a withdrawal as completed (processed to bank)."""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    tx = result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.status != "pending":
        raise HTTPException(status_code=400, detail=f"Transaction is already {tx.status}")

    tx.status = "completed"
    await db.commit()
    return {"status": "completed", "transaction_id": transaction_id}


@router.patch("/withdrawals/{transaction_id}/fail")
async def fail_withdrawal(
    transaction_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark a withdrawal as failed and refund the user's wallet."""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    tx = result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.status != "pending":
        raise HTTPException(status_code=400, detail=f"Transaction is already {tx.status}")

    # Refund the wallet
    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalars().first()
    if user:
        user.wallet_balance += tx.amount

    tx.status = "failed"
    await db.commit()
    return {"status": "failed", "transaction_id": transaction_id, "refunded": True}
