from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    APP_NAME: str = "QuickGift API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/quickgift"
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quickgift-dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # Paystack
    PAYSTACK_SECRET_KEY: str = os.getenv("PAYSTACK_SECRET_KEY", "")
    PAYSTACK_PUBLIC_KEY: str = os.getenv("PAYSTACK_PUBLIC_KEY", "")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"

    # Commissions
    GIFT_COMMISSION_PERCENT: float = 25.0
    BEAUTY_COMMISSION_PERCENT: float = 20.0

    # Delivery
    DELIVERY_BASE_FEE: int = 1000
    DELIVERY_PER_KM: int = 200
    EXPRESS_MULTIPLIER: float = 2.5

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8081",
    ]


settings = Settings()
