import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint('user_id', 'target_type', 'target_id', name='uq_review_per_user_target'),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True)
    user_name: Mapped[str] = mapped_column(String(100))
    target_type: Mapped[str] = mapped_column(String(20))  # product, provider
    target_id: Mapped[str] = mapped_column(String, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)   # link to order
    booking_id: Mapped[Optional[str]] = mapped_column(String, nullable=True) # link to booking
    rating: Mapped[float] = mapped_column(Float)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
