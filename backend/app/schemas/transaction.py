from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FundWalletRequest(BaseModel):
    amount: float
    reference: str


class TransferRequest(BaseModel):
    recipient_phone: str
    amount: float


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    description: Optional[str]
    reference: str
    balance_after: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
