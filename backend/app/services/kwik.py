"""
Kwik Delivery integration for QuickGift.

Handles: login, get quote, create delivery, track, cancel.
Uses Kwik's vendor API — QuickGift acts as the vendor/merchant.
"""

import httpx
from typing import Optional
from datetime import datetime

from app.core.config import settings

# Cache the access token in memory (refreshed on 401)
_kwik_token: Optional[str] = None
_kwik_vendor_id: Optional[int] = None
_kwik_user_id: Optional[int] = None
_kwik_form_id: Optional[int] = None


async def _get_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=settings.KWIK_BASE_URL,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cache-Control": "no-cache",
        },
        timeout=30.0,
    )


async def login() -> dict:
    """
    Authenticate with Kwik as a vendor. Returns access_token and vendor details.
    Caches the token in memory for reuse.
    """
    global _kwik_token, _kwik_vendor_id, _kwik_user_id, _kwik_form_id

    if not settings.KWIK_EMAIL or not settings.KWIK_PASSWORD:
        raise Exception("Kwik credentials not configured (KWIK_EMAIL, KWIK_PASSWORD)")

    async with await _get_client() as client:
        resp = await client.post("/vendor_login", json={
            "domain_name": settings.KWIK_DOMAIN,
            "email": settings.KWIK_EMAIL,
            "password": settings.KWIK_PASSWORD,
            "api_login": 1,
        })

        data = resp.json()
        if data.get("status") != 200:
            raise Exception(f"Kwik login failed: {data.get('message', 'Unknown error')}")

        _kwik_token = data["data"]["access_token"]
        vendor = data["data"].get("vendor_details", {})
        _kwik_vendor_id = vendor.get("vendor_id")

        form = data["data"].get("formSettings", {})
        _kwik_form_id = form.get("form_id", 2)
        _kwik_user_id = form.get("user_id")

        return {
            "access_token": _kwik_token,
            "vendor_id": _kwik_vendor_id,
            "user_id": _kwik_user_id,
            "form_id": _kwik_form_id,
        }


async def _ensure_token():
    """Ensure we have a valid Kwik token, login if needed."""
    global _kwik_token
    if not _kwik_token:
        await login()


async def get_quote(
    pickup_address: str,
    pickup_lat: float,
    pickup_lng: float,
    delivery_address: str,
    delivery_lat: float,
    delivery_lng: float,
    vehicle_id: int = 0,  # 0=motorcycle, 1=small car
) -> dict:
    """
    Get a delivery price quote from Kwik.
    Returns the estimated cost.
    """
    await _ensure_token()

    pickup_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

    async with await _get_client() as client:
        resp = await client.post("/send_payment_for_task", json={
            "access_token": _kwik_token,
            "domain_name": settings.KWIK_DOMAIN,
            "vendor_id": _kwik_vendor_id,
            "user_id": _kwik_user_id,
            "form_id": _kwik_form_id,
            "is_multiple_tasks": 1,
            "layout_type": 0,
            "has_pickup": 1,
            "has_delivery": 1,
            "auto_assignment": 1,
            "vehicle_id": vehicle_id,
            "timezone": 60,  # WAT (Nigeria)
            "payment_method": 32,  # Card/Paystack
            "pickups": [{
                "address": pickup_address,
                "latitude": pickup_lat,
                "longitude": pickup_lng,
                "time": pickup_time,
            }],
            "deliveries": [{
                "address": delivery_address,
                "latitude": delivery_lat,
                "longitude": delivery_lng,
                "time": pickup_time,
                "has_return_task": False,
            }],
        })

        data = resp.json()
        if data.get("status") == 101:
            # Token expired, re-login and retry
            await login()
            return await get_quote(
                pickup_address, pickup_lat, pickup_lng,
                delivery_address, delivery_lat, delivery_lng,
                vehicle_id,
            )

        if data.get("status") != 200:
            raise Exception(f"Kwik quote failed: {data.get('message', 'Unknown error')}")

        return {
            "amount": data.get("data", {}).get("amount") or data.get("data", {}).get("per_task_cost"),
            "currency": "NGN",
            "vehicle_id": vehicle_id,
            "raw": data.get("data"),
        }


async def get_bill_breakdown(amount: float, vehicle_id: int = 0) -> dict:
    """Get detailed bill breakdown for a delivery amount."""
    await _ensure_token()

    async with await _get_client() as client:
        resp = await client.post("/get_bill_breakdown", json={
            "access_token": _kwik_token,
            "domain_name": settings.KWIK_DOMAIN,
            "user_id": _kwik_user_id,
            "amount": str(amount),
            "total_no_of_tasks": 1,
            "form_id": _kwik_form_id or 2,
            "insurance_amount": 0,
            "credits": 0,
            "vehicle_id": vehicle_id,
            "is_cod_job": 0,
            "is_loader_required": 0,
            "loaders_amount": 0,
            "loaders_count": 0,
            "delivery_charge_by_buyer": 2,
        })

        data = resp.json()
        return data.get("data", {})


async def create_delivery(
    pickup_address: str,
    pickup_lat: float,
    pickup_lng: float,
    pickup_name: str,
    pickup_phone: str,
    pickup_email: str = "",
    delivery_address: str = "",
    delivery_lat: float = 0,
    delivery_lng: float = 0,
    delivery_name: str = "",
    delivery_phone: str = "",
    delivery_email: str = "",
    delivery_instruction: str = "",
    amount: float = 0,
    vehicle_id: int = 0,
    parcel_amount: float = 0,
) -> dict:
    """
    Create a delivery task on Kwik.
    Returns unique_order_id for tracking.
    """
    await _ensure_token()

    pickup_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

    async with await _get_client() as client:
        resp = await client.post("/create_task_via_vendor", json={
            "access_token": _kwik_token,
            "domain_name": settings.KWIK_DOMAIN,
            "vendor_id": _kwik_vendor_id,
            "user_id": _kwik_user_id,
            "form_id": _kwik_form_id or 2,
            "custom_field_template": "pricing-template",
            "pickup_custom_field_template": "pricing-template",
            "timezone": 60,
            "is_multiple_tasks": 1,
            "layout_type": 0,
            "has_pickup": 1,
            "has_delivery": 1,
            "auto_assignment": 1,
            "vehicle_id": vehicle_id,
            "payment_method": 524288,
            "amount": amount,
            "delivery_charge": amount,
            "parcel_amount": parcel_amount,
            "delivery_instruction": delivery_instruction or "QuickGift delivery - handle with care",
            "pickups": [{
                "address": pickup_address,
                "name": pickup_name,
                "phone": pickup_phone,
                "email": pickup_email or f"{pickup_phone}@quickgift.ng",
                "latitude": pickup_lat,
                "longitude": pickup_lng,
                "time": pickup_time,
            }],
            "deliveries": [{
                "address": delivery_address,
                "name": delivery_name,
                "phone": delivery_phone,
                "email": delivery_email or f"{delivery_phone}@quickgift.ng",
                "latitude": delivery_lat,
                "longitude": delivery_lng,
                "time": pickup_time,
                "has_return_task": False,
            }],
        })

        data = resp.json()
        if data.get("status") == 101:
            await login()
            return await create_delivery(
                pickup_address, pickup_lat, pickup_lng,
                pickup_name, pickup_phone, pickup_email,
                delivery_address, delivery_lat, delivery_lng,
                delivery_name, delivery_phone, delivery_email,
                delivery_instruction, amount, vehicle_id, parcel_amount,
            )

        if data.get("status") != 200:
            raise Exception(f"Kwik create delivery failed: {data.get('message', 'Unknown error')}")

        return {
            "unique_order_id": data["data"].get("unique_order_id"),
            "job_id": data["data"].get("job_id"),
            "raw": data.get("data"),
        }


async def track_delivery(unique_order_id: str) -> dict:
    """
    Get the current status of a delivery.
    Returns status code + details.
    """
    await _ensure_token()

    async with await _get_client() as client:
        resp = await client.get("/getJobStatus", params={
            "unique_order_id": unique_order_id,
        })

        data = resp.json()
        if data.get("status") == 101:
            await login()
            return await track_delivery(unique_order_id)

        status_map = {
            0: "upcoming",
            1: "started",
            2: "ended",
            3: "failed",
            4: "arrived",
            6: "unassigned",
            7: "accepted",
            8: "declined",
            9: "cancelled",
            10: "deleted",
        }

        job_data = data.get("data", {})
        job_status = job_data.get("job_status", -1)

        return {
            "status": status_map.get(job_status, "unknown"),
            "status_code": job_status,
            "unique_order_id": unique_order_id,
            "raw": job_data,
        }


async def cancel_delivery(job_id: str) -> dict:
    """Cancel a delivery task."""
    await _ensure_token()

    async with await _get_client() as client:
        resp = await client.post("/cancel_vendor_task", json={
            "access_token": _kwik_token,
            "vendor_id": _kwik_vendor_id,
            "job_id": job_id,
            "job_status": 9,
            "domain_name": settings.KWIK_DOMAIN,
        })

        data = resp.json()
        if data.get("status") == 101:
            await login()
            return await cancel_delivery(job_id)

        if data.get("status") != 200:
            raise Exception(f"Kwik cancel failed: {data.get('message', 'Unknown error')}")

        return {"status": "cancelled", "job_id": job_id}
