from pydantic import BaseModel
from typing import Optional


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    code: str


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: Optional[str] = None
    city: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: Optional[str]
    phone: str
    city: Optional[str]
    avatar_url: Optional[str]
    role: str
    wallet_balance: float

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
