from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InitializePayment(BaseModel):
    order_id: Optional[str] = None
    booking_id: Optional[str] = None
    amount: float
    email: Optional[str] = None
    callback_url: Optional[str] = None
    method: Optional[str] = "card"  # "card" (Paystack) or "wallet"


class PaymentResponse(BaseModel):
    id: str
    reference: str
    amount: float
    currency: str
    status: str
    provider: str
    channel: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaystackWebhookEvent(BaseModel):
    event: str
    data: dict
