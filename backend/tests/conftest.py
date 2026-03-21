"""
Shared test fixtures for QuickGift API tests.
Uses an in-memory SQLite database for isolation.
"""

import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db


# In-memory SQLite for tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def db():
    """Direct database session for test setup."""
    async with TestSession() as session:
        yield session


# ── Helper functions ──────────────────────────────────────

async def create_test_user(db, phone="+2348012345678", name="Test User", role="user", password="test123"):
    """Create a user directly in the DB and return the user object."""
    from app.models.user import User
    from app.core.security import hash_password

    user = User(
        full_name=name,
        phone=phone,
        email=f"{phone.replace('+', '')}@test.ng",
        password_hash=hash_password(password),
        role=role,
        city="Lagos",
        is_active=True,
        wallet_balance=10000,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_test_admin(db):
    """Create an admin user."""
    return await create_test_user(db, phone="+2348000000001", name="Admin", role="admin")


async def create_test_provider(db, phone="+2348099999999"):
    """Create a provider user + provider profile."""
    from app.models.provider import Provider

    user = await create_test_user(db, phone=phone, name="Test Provider", role="provider")
    provider = Provider(
        user_id=user.id,
        business_name="Test Business",
        service_type="Nails",
        bio="Test bio",
        location="Lekki, Lagos",
        city="Lagos",
        status="verified",
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return user, provider


async def create_test_product(db, provider_id=None):
    """Create a test product."""
    from app.models.product import Product, Category

    cat = Category(name="Test Category", icon="🎁")
    db.add(cat)
    await db.flush()

    product = Product(
        name="Test Gift",
        description="A lovely test gift",
        price=5000,
        compare_price=6000,
        category_id=cat.id,
        vendor_name="Test Vendor",
        vendor_id=provider_id,
        status="active",
        city="Lagos",
        rating=4.5,
        review_count=10,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def get_auth_token(client, phone, password="test123"):
    """Get a JWT token by logging in."""
    resp = await client.post("/api/v1/auth/login", json={
        "phone": phone,
        "password": password,
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def auth_headers(token):
    """Return authorization headers."""
    return {"Authorization": f"Bearer {token}"}
