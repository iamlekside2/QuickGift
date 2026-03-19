import requests
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

TERMII_BASE_URL = "https://v3.api.termii.com/api/sms/send"


def send_sms(to: str, body: str) -> bool:
    """Send an SMS via Termii. Returns True on success, False on failure."""
    if not settings.TERMII_API_KEY:
        logger.warning("Termii API key not configured — SMS not sent")
        return False

    try:
        payload = {
            "to": to,
            "from": settings.TERMII_SENDER_ID,
            "sms": body,
            "type": "plain",
            "channel": "generic",
            "api_key": settings.TERMII_API_KEY,
        }
        response = requests.post(TERMII_BASE_URL, json=payload, timeout=10)
        data = response.json()

        if response.status_code == 200 and data.get("message") == "Successfully Sent":
            logger.info(f"SMS sent to {to} — message_id: {data.get('message_id')}")
            return True
        else:
            logger.error(f"Termii SMS failed for {to}: {data}")
            return False
    except Exception as e:
        logger.error(f"Failed to send SMS to {to}: {e}")
        return False


def send_otp_sms(phone: str, code: str) -> bool:
    """Send OTP code via SMS."""
    body = f"Your QuickGift verification code is: {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code."
    return send_sms(to=phone, body=body)
