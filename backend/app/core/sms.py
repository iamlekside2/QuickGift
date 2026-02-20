from twilio.rest import Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def send_sms(to: str, body: str) -> bool:
    """Send an SMS via Twilio. Returns True on success, False on failure."""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio credentials not configured — SMS not sent")
        return False

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to,
        )
        logger.info(f"SMS sent to {to} — SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {to}: {e}")
        return False


def send_otp_sms(phone: str, code: str) -> bool:
    """Send OTP code via SMS."""
    body = f"Your QuickGift verification code is: {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code."
    return send_sms(to=phone, body=body)
