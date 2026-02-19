from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    provider_id: str
    service_id: str
    service_type: str  # home, salon
    booking_date: datetime
    booking_time: str
    address: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    booking_number: str
    user_id: str
    provider_id: str
    service_id: str
    service_name: str
    service_type: str
    status: str
    booking_date: datetime
    booking_time: str
    duration_minutes: int
    price: float
    deposit: float
    address: Optional[str]
    notes: Optional[str]
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    status: str
