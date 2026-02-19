"""Seed the database with initial data."""
import asyncio
from app.core.database import async_session, init_db
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Category, Occasion, Product
from app.models.provider import Provider, Service


CATEGORIES = [
    {"name": "Cakes", "icon": "🎂", "description": "Birthday, wedding & celebration cakes", "sort_order": 1},
    {"name": "Flowers", "icon": "💐", "description": "Fresh bouquets & arrangements", "sort_order": 2},
    {"name": "Chocolates", "icon": "🍫", "description": "Premium chocolate gift boxes", "sort_order": 3},
    {"name": "Hampers", "icon": "🧺", "description": "Curated gift hampers", "sort_order": 4},
    {"name": "Personalized", "icon": "☕", "description": "Custom mugs, frames & more", "sort_order": 5},
    {"name": "Balloons", "icon": "🎈", "description": "Balloon bouquets & arches", "sort_order": 6},
]

OCCASIONS = [
    {"name": "Birthday", "icon": "🎂", "color": "#FF6B6B"},
    {"name": "Anniversary", "icon": "💕", "color": "#FF69B4"},
    {"name": "Wedding", "icon": "💍", "color": "#FFD700"},
    {"name": "Valentine's", "icon": "❤️", "color": "#FF1744"},
    {"name": "Get Well", "icon": "🌻", "color": "#4CAF50"},
    {"name": "Baby Shower", "icon": "👶", "color": "#64B5F6"},
    {"name": "Graduation", "icon": "🎓", "color": "#7C4DFF"},
    {"name": "Christmas", "icon": "🎄", "color": "#D32F2F"},
    {"name": "Mother's Day", "icon": "🌺", "color": "#E91E63"},
    {"name": "Just Because", "icon": "🎁", "color": "#F57C1F"},
]


async def seed():
    await init_db()

    async with async_session() as db:
        # Admin user
        admin = User(
            full_name="QuickGift Admin",
            phone="+2348000000000",
            email="admin@quickgift.ng",
            password_hash=hash_password("admin123"),
            role="admin",
            city="Lagos",
        )
        db.add(admin)

        # Categories
        cat_map = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
            cat_map[cat_data["name"]] = cat

        # Occasions
        for i, occ_data in enumerate(OCCASIONS):
            occ = Occasion(sort_order=i + 1, **occ_data)
            db.add(occ)

        await db.flush()

        # Sample products
        products = [
            {"name": "Red Velvet Cake", "price": 15000, "category": "Cakes", "vendor_name": "Sweet Treats Lagos", "city": "Lagos", "rating": 4.8, "is_featured": True},
            {"name": "Rose Bouquet (24 stems)", "price": 25000, "category": "Flowers", "vendor_name": "Bloom Nigeria", "city": "Lagos", "rating": 4.9, "is_featured": True},
            {"name": "Luxury Chocolate Box", "price": 12000, "category": "Chocolates", "vendor_name": "ChocoLux", "city": "Lagos", "rating": 4.7, "is_featured": True},
            {"name": "Birthday Hamper Deluxe", "price": 35000, "category": "Hampers", "vendor_name": "GiftBox NG", "city": "Lagos", "rating": 4.9, "is_featured": True},
            {"name": "Custom Photo Mug", "price": 5000, "category": "Personalized", "vendor_name": "PrintHub", "city": "Lagos", "rating": 4.5},
            {"name": "Balloon Arch Set", "price": 18000, "category": "Balloons", "vendor_name": "Party Central", "city": "Lagos", "rating": 4.6},
            {"name": "Fruit & Wine Hamper", "price": 28000, "category": "Hampers", "vendor_name": "GiftBox NG", "city": "Lagos", "rating": 4.8},
            {"name": "Sunflower Bouquet", "price": 18000, "category": "Flowers", "vendor_name": "Bloom Nigeria", "city": "Abuja", "rating": 4.7},
            {"name": "Chocolate Cake (2 tier)", "price": 22000, "category": "Cakes", "vendor_name": "Sweet Treats Lagos", "city": "Lagos", "rating": 4.8},
            {"name": "Baby Shower Hamper", "price": 30000, "category": "Hampers", "vendor_name": "GiftBox NG", "city": "Abuja", "rating": 4.6},
        ]

        for p in products:
            cat_name = p.pop("category")
            product = Product(category_id=cat_map[cat_name].id, **p)
            db.add(product)

        # Sample provider user
        provider_user = User(
            full_name="Amara Johnson",
            phone="+2348012345678",
            email="amara@quickgift.ng",
            password_hash=hash_password("provider123"),
            role="provider",
            city="Lagos",
        )
        db.add(provider_user)
        await db.flush()

        # Sample provider
        provider = Provider(
            user_id=provider_user.id,
            business_name="Amara Nails",
            service_type="Nail Technician",
            bio="Award-winning nail artist with 5 years experience",
            location="Lekki, Lagos",
            city="Lagos",
            rating=4.9,
            review_count=230,
            booking_count=312,
            experience_years=5,
            status="verified",
            plan="Pro",
        )
        db.add(provider)
        await db.flush()

        # Provider services
        services = [
            {"name": "Gel Nails (Full Set)", "price": 8000, "duration_minutes": 90},
            {"name": "Acrylic Nails", "price": 12000, "duration_minutes": 120},
            {"name": "Nail Art (Custom)", "price": 15000, "duration_minutes": 120},
            {"name": "Manicure & Pedicure", "price": 5000, "duration_minutes": 60},
        ]
        for s in services:
            service = Service(provider_id=provider.id, **s)
            db.add(service)

        await db.commit()
        print("Database seeded successfully!")
        print("Admin: admin@quickgift.ng / admin123")
        print("Provider: amara@quickgift.ng / provider123")


if __name__ == "__main__":
    asyncio.run(seed())
