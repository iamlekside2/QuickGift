from pydantic import BaseModel
from typing import Optional


class InitializePayment(BaseModel):
    order_id: Optional[str] = None
    booking_id: Optional[str] = None
    amount: float
    email: str
    callback_url: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    reference: str
    amount: float
    currency: str
    status: str
    provider: str
    created_at: str

    class Config:
        from_attributes = True


class PaystackWebhookEvent(BaseModel):
    event: str
    data: dict
