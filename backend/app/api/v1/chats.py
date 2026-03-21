from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.push import send_push
from app.models.chat import Conversation, Message
from app.models.user import User
from app.schemas.chat import (
    CreateConversationRequest,
    SendMessageRequest,
    ConversationResponse,
    MessageResponse,
)

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    page: int = 1,
    per_page: int = 30,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["user_id"]
    query = (
        select(Conversation)
        .where(
            or_(
                Conversation.buyer_id == user_id,
                Conversation.provider_id == user_id,
            )
        )
        .order_by(Conversation.last_message_at.desc().nullslast(), Conversation.created_at.desc())
        .offset((page - 1) * per_page).limit(per_page)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["user_id"]

    # Verify the user is part of this conversation
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            or_(
                Conversation.buyer_id == user_id,
                Conversation.provider_id == user_id,
            ),
        )
    )
    if not conv_result.scalars().first():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(100)  # Last 100 messages
    )
    messages = result.scalars().all()
    messages.reverse()  # Return in chronological order
    return messages


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    req: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["user_id"]

    # Verify the user is part of this conversation
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            or_(
                Conversation.buyer_id == user_id,
                Conversation.provider_id == user_id,
            ),
        )
    )
    conversation = conv_result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    from datetime import datetime

    # Derive sender_role from user's relationship to the conversation (prevent spoofing)
    actual_role = "buyer" if user_id == conversation.buyer_id else "provider"

    message = Message(
        conversation_id=conversation_id,
        sender_role=actual_role,
        text=req.text,
    )
    db.add(message)

    # Update conversation's last message
    conversation.last_message = req.text
    conversation.last_message_at = datetime.utcnow()

    await db.commit()
    await db.refresh(message)

    # Push notification to the other participant
    sender = await db.execute(select(User).where(User.id == user_id))
    sender_user = sender.scalars().first()
    sender_name = sender_user.full_name if sender_user else "Someone"

    # Determine the recipient (the other participant)
    recipient_id = (
        conversation.provider_id if user_id == conversation.buyer_id else conversation.buyer_id
    )
    recipient_result = await db.execute(select(User).where(User.id == recipient_id))
    recipient = recipient_result.scalars().first()
    if recipient and recipient.push_token:
        await send_push(
            recipient.push_token,
            f"New message from {sender_name}",
            req.text[:100],
            {"type": "chat", "conversation_id": conversation_id},
        )

    return message


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    req: CreateConversationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime

    conversation = Conversation(
        buyer_id=current_user["user_id"],
        provider_id=req.provider_id,
        provider_name=req.provider_name,
        last_message=req.initial_message,
        last_message_at=datetime.utcnow() if req.initial_message else None,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    # Create initial message if provided
    if req.initial_message:
        message = Message(
            conversation_id=conversation.id,
            sender_role="buyer",
            text=req.initial_message,
        )
        db.add(message)
        await db.commit()

    return conversation
