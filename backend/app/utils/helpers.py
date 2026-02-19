"""Utility helper functions for QuickGift backend."""
import re
from datetime import datetime


def format_naira(amount: float) -> str:
    """Format amount as Nigerian Naira."""
    return f"₦{amount:,.2f}"


def validate_nigerian_phone(phone: str) -> bool:
    """Validate Nigerian phone number format."""
    pattern = r'^(\+234|234|0)[789][01]\d{8}$'
    return bool(re.match(pattern, phone.replace(" ", "").replace("-", "")))


def normalize_phone(phone: str) -> str:
    """Normalize phone number to +234 format."""
    phone = phone.replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        return "+234" + phone[1:]
    elif phone.startswith("234"):
        return "+" + phone
    elif phone.startswith("+234"):
        return phone
    return phone


def time_ago(dt: datetime) -> str:
    """Return human readable time difference."""
    diff = datetime.utcnow() - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        mins = int(seconds / 60)
        return f"{mins}m ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours}h ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days}d ago"
    else:
        return dt.strftime("%b %d, %Y")
