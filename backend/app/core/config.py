from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    APP_NAME: str = "QuickGift API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database (SQLite for dev, PostgreSQL for production)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./quickgift.db"
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quickgift-dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # Termii SMS
    TERMII_API_KEY: str = os.getenv("TERMII_API_KEY", "")
    TERMII_SENDER_ID: str = os.getenv("TERMII_SENDER_ID", "QuickGift")

    # Paystack — uses test keys by default, live keys only when PAYSTACK_LIVE=true
    PAYSTACK_LIVE: bool = os.getenv("PAYSTACK_LIVE", "false").lower() == "true"
    PAYSTACK_TEST_SECRET_KEY: str = os.getenv("PAYSTACK_TEST_SECRET_KEY", "")
    PAYSTACK_TEST_PUBLIC_KEY: str = os.getenv("PAYSTACK_TEST_PUBLIC_KEY", "")
    PAYSTACK_LIVE_SECRET_KEY: str = os.getenv("PAYSTACK_LIVE_SECRET_KEY", "")
    PAYSTACK_LIVE_PUBLIC_KEY: str = os.getenv("PAYSTACK_LIVE_PUBLIC_KEY", "")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"

    @property
    def PAYSTACK_SECRET_KEY(self) -> str:
        if self.PAYSTACK_LIVE:
            return self.PAYSTACK_LIVE_SECRET_KEY
        return self.PAYSTACK_TEST_SECRET_KEY

    @property
    def PAYSTACK_PUBLIC_KEY(self) -> str:
        if self.PAYSTACK_LIVE:
            return self.PAYSTACK_LIVE_PUBLIC_KEY
        return self.PAYSTACK_TEST_PUBLIC_KEY

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Commissions (10% for both products and services)
    GIFT_COMMISSION_PERCENT: float = float(os.getenv("GIFT_COMMISSION_PERCENT", "10.0"))
    BEAUTY_COMMISSION_PERCENT: float = float(os.getenv("BEAUTY_COMMISSION_PERCENT", "10.0"))

    # Delivery (0 = providers handle their own, Kwik used when dispatched)
    DELIVERY_BASE_FEE: int = 0
    DELIVERY_PER_KM: int = 0
    EXPRESS_MULTIPLIER: float = 1.0

    # Provider Payouts
    PAYOUT_HOLD_HOURS: int = 24

    # Kwik Delivery
    KWIK_EMAIL: str = os.getenv("KWIK_EMAIL", "")
    KWIK_PASSWORD: str = os.getenv("KWIK_PASSWORD", "")
    KWIK_ENV: str = os.getenv("KWIK_ENV", "test")  # "test" or "live"

    @property
    def KWIK_BASE_URL(self) -> str:
        if self.KWIK_ENV == "live":
            return "https://apicopy.kwik.delivery"
        return "https://api.kwik.delivery"

    @property
    def KWIK_DOMAIN(self) -> str:
        if self.KWIK_ENV == "live":
            return "app.kwik.delivery"
        return "app-test.kwik.delivery"

    # CORS — always include production + local dev, plus any from env
    ALLOWED_ORIGINS: list = list(set(
        [
            "https://quickgift-admin.onrender.com",
            "https://quickgift-landing.onrender.com",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "http://localhost:8081",
        ] + [
            o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
        ]
    ))

    @property
    def async_database_url(self) -> str:
        """Convert DATABASE_URL to async-compatible format for SQLAlchemy."""
        url = self.DATABASE_URL
        # Render/Railway provide postgres:// but SQLAlchemy needs postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
