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

    # Paystack
    PAYSTACK_SECRET_KEY: str = os.getenv("PAYSTACK_SECRET_KEY", "")
    PAYSTACK_PUBLIC_KEY: str = os.getenv("PAYSTACK_PUBLIC_KEY", "")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Commissions (10% for both products and services)
    GIFT_COMMISSION_PERCENT: float = float(os.getenv("GIFT_COMMISSION_PERCENT", "10.0"))
    BEAUTY_COMMISSION_PERCENT: float = float(os.getenv("BEAUTY_COMMISSION_PERCENT", "10.0"))

    # Delivery (disabled for now — providers handle their own)
    DELIVERY_BASE_FEE: int = 0
    DELIVERY_PER_KM: int = 0
    EXPRESS_MULTIPLIER: float = 1.0

    # Provider Payouts
    PAYOUT_HOLD_HOURS: int = 24  # hold period after delivery before auto-payout

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
