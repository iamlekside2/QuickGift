import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)

    # Kwik reference
    kwik_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    kwik_job_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status: pending, dispatched, picked_up, in_transit, delivered, failed, cancelled
    status: Mapped[str] = mapped_column(String(20), default="pending")

    # Pickup (vendor)
    pickup_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pickup_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pickup_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pickup_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pickup_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Dropoff (recipient)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    delivery_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    delivery_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    delivery_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Cost
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0)
    vehicle_type: Mapped[str] = mapped_column(String(20), default="motorcycle")  # motorcycle, car

    # Timestamps
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    picked_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
