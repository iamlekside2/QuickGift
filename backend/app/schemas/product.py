from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: Optional[str]
    description: Optional[str]
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class OccasionResponse(BaseModel):
    id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    category_id: str
    vendor_name: str
    vendor_id: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "active"
    is_featured: bool = False
    city: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: float
    compare_price: Optional[float]
    category_id: str
    vendor_name: str
    image_url: Optional[str]
    rating: float
    review_count: int
    order_count: int
    status: str
    is_featured: bool
    city: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    per_page: int
