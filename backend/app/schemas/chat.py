from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateConversationRequest(BaseModel):
    provider_id: str
    provider_name: str
    initial_message: Optional[str] = None


class SendMessageRequest(BaseModel):
    text: str
    sender_role: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_role: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    buyer_id: str
    provider_id: str
    provider_name: str
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
