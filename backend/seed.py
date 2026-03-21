"""
QuickGift Database Seed Script
===============================
Populates the database with categories, occasions, products, and sample providers.
Only inserts data if the respective tables are empty (safe to run multiple times).

Usage:
    python seed.py
"""

import asyncio
import uuid
import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, func

from app.core.database import engine, async_session, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Category, Occasion, Product
from app.models.provider import Provider, Service


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Seed data definitions
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"name": "Cakes & Desserts",    "icon": "🎂", "description": "Birthday, wedding & celebration cakes",  "sort_order": 1},
    {"name": "Flowers",             "icon": "💐", "description": "Fresh bouquets & arrangements",          "sort_order": 2},
    {"name": "Chocolates & Snacks", "icon": "🍫", "description": "Premium chocolate & snack gift boxes",   "sort_order": 3},
    {"name": "Gift Hampers",        "icon": "🧺", "description": "Curated gift hampers for every occasion","sort_order": 4},
    {"name": "Balloons & Cards",    "icon": "🎈", "description": "Balloon bouquets, arches & greeting cards","sort_order": 5},
    {"name": "Personalized",        "icon": "✨", "description": "Custom mugs, frames & engraved gifts",   "sort_order": 6},
]

OCCASIONS = [
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

# category_key is resolved to category_id at runtime
PRODUCTS = [
    {
        "name": "Red Velvet Cake",
        "description": "Three-layer red velvet cake with cream cheese frosting, beautifully decorated.",
        "price": 15000,
        "compare_price": 18000,
        "category_key": "Cakes & Desserts",
        "vendor_name": "Sweet Treats Lagos",
        "rating": 4.8,
        "review_count": 124,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["birthday","anniversary","celebration"]',
    },
    {
        "name": "Rose Bouquet Premium",
        "description": "24 premium long-stem red roses wrapped in luxury packaging with a personal note card.",
        "price": 25000,
        "compare_price": 30000,
        "category_key": "Flowers",
        "vendor_name": "Bloom Nigeria",
        "rating": 4.9,
        "review_count": 89,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["romance","valentine","anniversary"]',
    },
    {
        "name": "Luxury Chocolate Box",
        "description": "Assorted Belgian chocolates in an elegant gift box (24 pieces).",
        "price": 8500,
        "compare_price": 10000,
        "category_key": "Chocolates & Snacks",
        "vendor_name": "ChocoLux",
        "rating": 4.7,
        "review_count": 56,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["chocolate","luxury","gift"]',
    },
    {
        "name": "Birthday Hamper Deluxe",
        "description": "Premium hamper with wine, chocolates, scented candles, and a personalised card.",
        "price": 35000,
        "compare_price": 42000,
        "category_key": "Gift Hampers",
        "vendor_name": "GiftBox NG",
        "rating": 4.9,
        "review_count": 201,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["birthday","hamper","premium"]',
    },
    {
        "name": "Custom Photo Mug",
        "description": "High-quality ceramic mug with your favourite photo printed on both sides.",
        "price": 5000,
        "compare_price": 6500,
        "category_key": "Personalized",
        "vendor_name": "PrintHub",
        "rating": 4.5,
        "review_count": 78,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["personalized","mug","photo"]',
    },
    {
        "name": "Balloon Arch Set",
        "description": "Complete balloon arch kit with 60 balloons, pump, and decorating strip. Choose your colours.",
        "price": 12000,
        "compare_price": 15000,
        "category_key": "Balloons & Cards",
        "vendor_name": "Party Central",
        "rating": 4.6,
        "review_count": 42,
        "is_featured": True,
        "city": "Lagos",
        "tags": '["party","decoration","balloon"]',
    },
    {
        "name": "Vanilla Birthday Cake",
        "description": "Classic vanilla sponge cake with buttercream icing and sprinkles. Serves 10-12.",
        "price": 12000,
        "compare_price": 14000,
        "category_key": "Cakes & Desserts",
        "vendor_name": "Sweet Treats Lagos",
        "rating": 4.6,
        "review_count": 95,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["birthday","vanilla","cake"]',
    },
    {
        "name": "Mixed Flower Bouquet",
        "description": "Seasonal mix of roses, lilies, and chrysanthemums in a rustic wrap.",
        "price": 18000,
        "compare_price": 22000,
        "category_key": "Flowers",
        "vendor_name": "Bloom Nigeria",
        "rating": 4.7,
        "review_count": 67,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["flowers","mixed","seasonal"]',
    },
    {
        "name": "Anniversary Hamper",
        "description": "Champagne, gourmet treats, scented candles, and a keepsake box for that special couple.",
        "price": 42000,
        "compare_price": 50000,
        "category_key": "Gift Hampers",
        "vendor_name": "GiftBox NG",
        "rating": 4.8,
        "review_count": 134,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["anniversary","hamper","luxury"]',
    },
    {
        "name": "Assorted Truffles Box",
        "description": "Hand-rolled truffles in dark, milk, and white chocolate (16 pieces).",
        "price": 8500,
        "compare_price": 10000,
        "category_key": "Chocolates & Snacks",
        "vendor_name": "ChocoLux",
        "rating": 4.6,
        "review_count": 44,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["chocolate","truffle","assorted"]',
    },
    {
        "name": "Helium Balloon Set (12)",
        "description": "12 pre-inflated helium balloons with ribbons. Perfect for birthdays and celebrations.",
        "price": 10000,
        "compare_price": 12000,
        "category_key": "Balloons & Cards",
        "vendor_name": "Party Central",
        "rating": 4.4,
        "review_count": 38,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["helium","balloon","party"]',
    },
    {
        "name": "Engraved Wooden Frame",
        "description": "Handcrafted wooden photo frame with custom laser engraving. Fits 5x7 photos.",
        "price": 7500,
        "compare_price": 9000,
        "category_key": "Personalized",
        "vendor_name": "PrintHub",
        "rating": 4.3,
        "review_count": 31,
        "is_featured": False,
        "city": "Lagos",
        "tags": '["personalized","frame","engraved"]',
    },
]

# Each entry creates a User + Provider + Services
PROVIDERS = [
    {
        "user": {
            "full_name": "Amara Okonkwo",
            "phone": "+2348101000001",
            "email": "amara@quickgift.ng",
            "city": "Lagos",
            "role": "provider",
        },
        "provider": {
            "business_name": "Amara Nails",
            "service_type": "Nail Tech",
            "bio": "Certified nail technician specialising in gel extensions, nail art, and luxury manicures. 5+ years experience.",
            "location": "Lekki, Lagos",
            "city": "Lagos",
            "lat": 6.4478,
            "lng": 3.4723,
            "rating": 4.8,
            "review_count": 230,
            "booking_count": 412,
            "experience_years": 5,
            "status": "verified",
        },
        "services": [
            {"name": "Gel Manicure",       "description": "Full gel manicure with nail art options.",       "price": 5000,  "duration_minutes": 60},
            {"name": "Acrylic Full Set",   "description": "Full set acrylic nails with shape of choice.",  "price": 12000, "duration_minutes": 90},
            {"name": "Luxury Pedicure",    "description": "Spa pedicure with exfoliation and gel polish.",  "price": 7000,  "duration_minutes": 75},
        ],
    },
    {
        "user": {
            "full_name": "Bimpe Adeyemi",
            "phone": "+2348101000002",
            "email": "bimpe@quickgift.ng",
            "city": "Lagos",
            "role": "provider",
        },
        "provider": {
            "business_name": "Bimpe Hair Studio",
            "service_type": "Hair Styling",
            "bio": "Expert braider and hair stylist. Specialising in protective styles, silk press, and bridal hair.",
            "location": "Ikeja, Lagos",
            "city": "Lagos",
            "lat": 6.6018,
            "lng": 3.3515,
            "rating": 4.7,
            "review_count": 189,
            "booking_count": 340,
            "experience_years": 7,
            "status": "verified",
        },
        "services": [
            {"name": "Box Braids (Mid-length)", "description": "Knotless box braids, mid-back length.",   "price": 15000, "duration_minutes": 180},
            {"name": "Silk Press",               "description": "Silk press blowout for natural hair.",    "price": 8000,  "duration_minutes": 90},
            {"name": "Bridal Updo",              "description": "Elegant bridal updo with accessories.",   "price": 25000, "duration_minutes": 120},
        ],
    },
    {
        "user": {
            "full_name": "Tolu Bakare",
            "phone": "+2348101000003",
            "email": "tolu@quickgift.ng",
            "city": "Lagos",
            "role": "provider",
        },
        "provider": {
            "business_name": "Tolu MUA",
            "service_type": "Makeup",
            "bio": "Professional makeup artist for weddings, editorials, and everyday glam. Featured in BellaNaija Weddings.",
            "location": "Victoria Island, Lagos",
            "city": "Lagos",
            "lat": 6.4281,
            "lng": 3.4219,
            "rating": 4.9,
            "review_count": 310,
            "booking_count": 520,
            "experience_years": 8,
            "status": "verified",
        },
        "services": [
            {"name": "Full Glam Makeup",      "description": "Full face beat for events and occasions.",         "price": 25000, "duration_minutes": 90},
            {"name": "Bridal Makeup",          "description": "Complete bridal makeup package with touch-up kit.", "price": 50000, "duration_minutes": 120},
            {"name": "Natural Everyday Look",  "description": "Soft glam for everyday wear.",                     "price": 15000, "duration_minutes": 60},
        ],
    },
    {
        "user": {
            "full_name": "Emeka Chukwu",
            "phone": "+2348101000004",
            "email": "emeka@quickgift.ng",
            "city": "Abuja",
            "role": "provider",
        },
        "provider": {
            "business_name": "Fresh Cuts Abuja",
            "service_type": "Barber",
            "bio": "Premium barbershop experience. Clean fades, beard grooming, and hot towel shaves.",
            "location": "Wuse, Abuja",
            "city": "Abuja",
            "lat": 9.0579,
            "lng": 7.4951,
            "rating": 4.6,
            "review_count": 156,
            "booking_count": 280,
            "experience_years": 6,
            "status": "verified",
        },
        "services": [
            {"name": "Skin Fade",              "description": "Clean skin fade with line up.",                  "price": 3000, "duration_minutes": 45},
            {"name": "Beard Trim & Shape",     "description": "Precision beard trim with hot towel finish.",    "price": 2000, "duration_minutes": 30},
            {"name": "Full Grooming Package",  "description": "Haircut, beard trim, and hot towel shave.",      "price": 5000, "duration_minutes": 75},
        ],
    },
]


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

async def seed_admin(session):
    """Seed admin user if not present."""
    existing = await session.execute(
        select(User).where(User.email == "admin@quickgift.ng")
    )
    if existing.scalars().first():
        print("  Admin user: already exists, skipping.")
        return

    admin = User(
        id=_id(),
        full_name="QuickGift Admin",
        phone="+2348000000000",
        email="admin@quickgift.ng",
        password_hash=hash_password("admin123"),
        role="admin",
        city="Lagos",
        is_active=True,
    )
    session.add(admin)
    await session.flush()
    print("  Admin user: created (admin@quickgift.ng / admin123).")


async def seed_categories(session) -> dict[str, str]:
    """Seed categories. Returns a mapping of name -> id."""
    count = await session.scalar(select(func.count()).select_from(Category))
    if count and count > 0:
        print(f"  Categories: already has {count} rows, skipping.")
        result = await session.execute(select(Category))
        return {c.name: c.id for c in result.scalars().all()}

    mapping = {}
    for cat in CATEGORIES:
        cat_id = _id()
        session.add(Category(id=cat_id, **cat))
        mapping[cat["name"]] = cat_id

    await session.flush()
    print(f"  Categories: seeded {len(CATEGORIES)} rows.")
    return mapping


async def seed_occasions(session):
    """Seed occasions."""
    count = await session.scalar(select(func.count()).select_from(Occasion))
    if count and count > 0:
        print(f"  Occasions: already has {count} rows, skipping.")
        return

    for occ in OCCASIONS:
        session.add(Occasion(id=_id(), **occ))

    await session.flush()
    print(f"  Occasions: seeded {len(OCCASIONS)} rows.")


async def seed_products(session, category_map: dict[str, str]):
    """Seed products using the category name -> id mapping."""
    count = await session.scalar(select(func.count()).select_from(Product))
    if count and count > 0:
        print(f"  Products: already has {count} rows, skipping.")
        return

    for prod in PRODUCTS:
        data = {k: v for k, v in prod.items() if k != "category_key"}
        data["category_id"] = category_map[prod["category_key"]]
        data["id"] = _id()
        data["status"] = "active"
        session.add(Product(**data))

    await session.flush()
    print(f"  Products: seeded {len(PRODUCTS)} rows.")


async def seed_providers(session):
    """Seed provider users, provider profiles, and services."""
    count = await session.scalar(select(func.count()).select_from(Provider))
    if count and count > 0:
        print(f"  Providers: already has {count} rows, skipping.")
        return

    for entry in PROVIDERS:
        # Create User
        user_id = _id()
        user_data = {**entry["user"], "id": user_id, "is_active": True}
        user_data["password_hash"] = hash_password("provider123")
        session.add(User(**user_data))

        # Create Provider
        provider_id = _id()
        provider_data = {**entry["provider"], "id": provider_id, "user_id": user_id}
        session.add(Provider(**provider_data))

        # Create Services
        for svc in entry["services"]:
            session.add(Service(id=_id(), provider_id=provider_id, **svc))

    await session.flush()
    total_services = sum(len(e["services"]) for e in PROVIDERS)
    print(f"  Providers: seeded {len(PROVIDERS)} providers, {total_services} services, {len(PROVIDERS)} user accounts.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def run_migrations(eng):
    """Add missing columns to existing tables. Must run BEFORE any ORM queries."""
    from sqlalchemy import text

    is_pg = "postgresql" in str(eng.url) or "postgres" in str(eng.url)
    float_type = "DOUBLE PRECISION" if is_pg else "FLOAT"

    migrations = [
        ("users", "push_token", "VARCHAR(200)"),
        ("users", "lat", float_type),
        ("users", "lng", float_type),
        ("users", "updated_at", "TIMESTAMP"),
    ]

    async with eng.begin() as conn:
        for table, column, col_type in migrations:
            try:
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                print(f"  Migration: added {table}.{column}")
            except Exception as e:
                err_str = str(e).lower()
                if "already exists" in err_str or "duplicate column" in err_str:
                    print(f"  Migration: {table}.{column} already exists")
                elif "does not exist" in err_str or "undefined table" in err_str:
                    print(f"  Migration: {table} table not found yet (will be created)")
                else:
                    print(f"  Migration: {table}.{column} error: {e}")


async def main():
    print("=" * 50)
    print("  QuickGift Database Seed")
    print("=" * 50)

    # Step 1: Add missing columns to existing tables FIRST
    # This MUST run before create_all or any ORM queries
    await run_migrations(engine)

    # Step 2: Create any new tables that don't exist yet
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Tables: ensured all tables exist.")
    print()

    async with async_session() as session:
        async with session.begin():
            await seed_admin(session)
            category_map = await seed_categories(session)
            await seed_occasions(session)
            await seed_products(session, category_map)
            await seed_providers(session)

    print("\n" + "=" * 50)
    print("  Seed complete!")
    print("=" * 50)
    print("\n  Login credentials:")
    print("    Admin:    admin@quickgift.ng / admin123")
    print("    Provider: amara@quickgift.ng / provider123")
    print("    Provider: bimpe@quickgift.ng / provider123")
    print("    Provider: tolu@quickgift.ng  / provider123")
    print("    Provider: emeka@quickgift.ng / provider123")


if __name__ == "__main__":
    asyncio.run(main())
