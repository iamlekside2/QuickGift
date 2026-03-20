import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(token: str, title: str, body: str, data: dict = None):
    """Send push notification via Expo Push API."""
    if not token or not token.startswith("ExponentPushToken"):
        return
    message = {"to": token, "title": title, "body": body, "sound": "default"}
    if data:
        message["data"] = data
    async with httpx.AsyncClient() as client:
        await client.post(EXPO_PUSH_URL, json=message)
