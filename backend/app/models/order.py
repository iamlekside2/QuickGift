import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    order_type: Mapped[str] = mapped_column(String(20))  # gift, beauty
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, confirmed, in_transit, delivered, cancelled
    subtotal: Mapped[float] = mapped_column(Float)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0)
    commission: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_city: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    recipient_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    recipient_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    personal_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_express: Mapped[bool] = mapped_column(Boolean, default=False)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, paid, refunded
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(200))
    vendor_name: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float)
    total_price: Mapped[float] = mapped_column(Float)
