import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(5), default="NGN")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, success, failed, refunded
    provider: Mapped[str] = mapped_column(String(20), default="paystack")  # paystack, flutterwave
    channel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # card, bank, ussd, etc.
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
