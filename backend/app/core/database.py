from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import sqlalchemy

from app.core.config import settings

db_url = settings.async_database_url

connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(db_url, echo=settings.DEBUG, connect_args=connect_args)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    # Run migrations FIRST (add columns to existing tables)
    # This must happen before create_all so models can reference new columns
    is_pg = "postgresql" in db_url or "postgres" in db_url
    float_type = "DOUBLE PRECISION" if is_pg else "FLOAT"
    varchar = "VARCHAR" if is_pg else "VARCHAR"

    migrations = [
        ("users", "push_token", f"{varchar}(200)"),
        ("users", "lat", float_type),
        ("users", "lng", float_type),
        ("users", "updated_at", "TIMESTAMP"),
    ]

    async with engine.begin() as conn:
        for table, column, col_type in migrations:
            try:
                await conn.execute(
                    sqlalchemy.text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                    )
                )
            except Exception:
                pass  # Column already exists

    # Create any new tables (bank_accounts, deliveries, payouts, etc.)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
