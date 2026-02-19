import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    provider_id: Mapped[str] = mapped_column(String, ForeignKey("providers.id"))
    service_id: Mapped[str] = mapped_column(String, ForeignKey("services.id"))
    service_name: Mapped[str] = mapped_column(String(200))
    service_type: Mapped[str] = mapped_column(String(20))  # home, salon
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, confirmed, in_progress, completed, cancelled
    booking_date: Mapped[datetime] = mapped_column(DateTime)
    booking_time: Mapped[str] = mapped_column(String(10))  # "10:00"
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    price: Mapped[float] = mapped_column(Float)
    deposit: Mapped[float] = mapped_column(Float, default=0.0)
    commission: Mapped[float] = mapped_column(Float, default=0.0)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
