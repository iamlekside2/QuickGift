from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = 1


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_address: str
    delivery_city: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    personal_message: Optional[str] = None
    is_anonymous: bool = False
    is_express: bool = False
    scheduled_date: Optional[datetime] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    vendor_name: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    order_type: str
    status: str
    subtotal: float
    delivery_fee: float
    total: float
    delivery_address: Optional[str]
    delivery_city: Optional[str]
    recipient_name: Optional[str]
    personal_message: Optional[str]
    is_anonymous: bool
    is_express: bool
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    items: List[OrderItemResponse] = []


class OrderStatusUpdate(BaseModel):
    status: str
