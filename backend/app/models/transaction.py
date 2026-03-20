import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(10))  # credit, debit
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    balance_after: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="completed")  # pending, completed, failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
