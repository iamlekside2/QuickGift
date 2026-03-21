import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Dispute(Base):
    __tablename__ = "disputes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    buyer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    provider_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Dispute details
    reason: Mapped[str] = mapped_column(String(50))  # not_received, wrong_item, poor_quality, unresponsive, other
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_urls: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of image URLs

    # Provider response
    provider_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_evidence_urls: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Resolution
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    # open, provider_responded, resolved_buyer, resolved_provider, closed
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # admin user ID
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
