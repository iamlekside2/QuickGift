from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    page: int = 1,
    per_page: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Notification)
        .where(Notification.user_id == current_user["user_id"])
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user["user_id"],
        )
    )
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.patch("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user["user_id"],
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}
