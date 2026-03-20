import uuid

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
