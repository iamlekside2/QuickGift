"""
Unified notification helper — sends push + in-app for any event.
Usage: await notify_user(user_id, title, body, notif_type, data, db)
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.notification import Notification
from app.core.push import send_push


async def notify_user(
    user_id: str,
    title: str,
    body: str,
    notif_type: str = "system",
    data: dict = None,
    db: AsyncSession = None,
):
    """Send push notification + create in-app notification record."""
    if not db:
        return

    # Create in-app notification record
    notif = Notification(
        user_id=user_id,
        title=title,
        description=body,
        type=notif_type,
    )
    db.add(notif)

    # Send push notification
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if user and user.push_token:
        try:
            await send_push(user.push_token, title, body, data or {})
        except Exception:
            pass  # Push failure should not block the operation
