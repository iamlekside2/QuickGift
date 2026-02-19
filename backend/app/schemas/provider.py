from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProviderCreate(BaseModel):
    business_name: str
    service_type: str
    bio: Optional[str] = None
    location: str
    city: str
    experience_years: int = 0
    offers_home_service: bool = True
    offers_salon_service: bool = True


class ProviderUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    is_available: Optional[bool] = None
    offers_home_service: Optional[bool] = None
    offers_salon_service: Optional[bool] = None


class ProviderResponse(BaseModel):
    id: str
    user_id: str
    business_name: str
    service_type: str
    bio: Optional[str]
    location: str
    city: str
    rating: float
    review_count: int
    booking_count: int
    experience_years: int
    status: str
    plan: str
    is_available: bool
    offers_home_service: bool
    offers_salon_service: bool
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int = 60


class ServiceResponse(BaseModel):
    id: str
    provider_id: str
    name: str
    description: Optional[str]
    price: float
    duration_minutes: int
    is_active: bool

    class Config:
        from_attributes = True


class ProviderDetailResponse(ProviderResponse):
    services: List[ServiceResponse] = []
    portfolio: List[dict] = []
