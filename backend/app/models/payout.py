import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id: Mapped[str] = mapped_column(String, ForeignKey("providers.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    amount: Mapped[float] = mapped_column(Float)  # amount due to provider (total - commission)
    commission: Mapped[float] = mapped_column(Float)  # QuickGift's commission
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending → held → released → paid | cancelled
    # pending: order placed but not paid
    # held: paid, waiting hold period (24h after delivery)
    # released: hold period over, ready to pay
    # paid: paid to provider wallet
    # cancelled: order cancelled, no payout
    hold_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
