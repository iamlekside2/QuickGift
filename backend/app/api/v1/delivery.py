from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.config import settings
from app.models.delivery import Delivery
from app.models.order import Order
from app.services import kwik as kwik_service

router = APIRouter(prefix="/delivery", tags=["Delivery"])


# ── Schemas ──────────────────────────────────────────────

class DeliveryQuoteRequest(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    delivery_address: str
    delivery_lat: float
    delivery_lng: float
    vehicle_id: int = 0  # 0=motorcycle, 1=small car


class CreateDeliveryRequest(BaseModel):
    order_id: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    pickup_name: str
    pickup_phone: str
    delivery_address: str
    delivery_lat: float
    delivery_lng: float
    delivery_name: str
    delivery_phone: str
    delivery_instruction: Optional[str] = ""
    vehicle_id: int = 0


# ── Endpoints ────────────────────────────────────────────

@router.post("/quote")
async def get_delivery_quote(
    req: DeliveryQuoteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Get a delivery price quote from Kwik."""
    if not settings.KWIK_EMAIL:
        # Fallback: return a flat estimate if Kwik not configured
        return {
            "amount": 1500,
            "currency": "NGN",
            "source": "estimate",
            "message": "Kwik not configured — returning flat estimate",
        }

    try:
        quote = await kwik_service.get_quote(
            pickup_address=req.pickup_address,
            pickup_lat=req.pickup_lat,
            pickup_lng=req.pickup_lng,
            delivery_address=req.delivery_address,
            delivery_lat=req.delivery_lat,
            delivery_lng=req.delivery_lng,
            vehicle_id=req.vehicle_id,
        )
        return {
            "amount": quote["amount"],
            "currency": "NGN",
            "source": "kwik",
        }
    except Exception as e:
        # Fallback on error
        return {
            "amount": 1500,
            "currency": "NGN",
            "source": "estimate",
            "message": str(e),
        }


@router.post("/create")
async def create_delivery(
    req: CreateDeliveryRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a delivery for a paid order. Dispatches to Kwik if configured."""
    # Verify order exists and belongs to user
    order_result = await db.execute(select(Order).where(Order.id == req.order_id))
    order = order_result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Order must be paid before creating delivery")

    # Check for existing delivery
    existing = await db.execute(
        select(Delivery).where(Delivery.order_id == req.order_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Delivery already exists for this order")

    # Create delivery record
    delivery = Delivery(
        order_id=req.order_id,
        user_id=current_user["user_id"],
        pickup_address=req.pickup_address,
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        pickup_name=req.pickup_name,
        pickup_phone=req.pickup_phone,
        delivery_address=req.delivery_address,
        delivery_lat=req.delivery_lat,
        delivery_lng=req.delivery_lng,
        delivery_name=req.delivery_name,
        delivery_phone=req.delivery_phone,
        vehicle_type="motorcycle" if req.vehicle_id == 0 else "car",
    )

    # Try dispatching to Kwik
    if settings.KWIK_EMAIL:
        try:
            # Get quote first for the fee
            quote = await kwik_service.get_quote(
                pickup_address=req.pickup_address,
                pickup_lat=req.pickup_lat,
                pickup_lng=req.pickup_lng,
                delivery_address=req.delivery_address,
                delivery_lat=req.delivery_lat,
                delivery_lng=req.delivery_lng,
                vehicle_id=req.vehicle_id,
            )
            delivery.delivery_fee = quote.get("amount", 0)

            # Create the task
            result = await kwik_service.create_delivery(
                pickup_address=req.pickup_address,
                pickup_lat=req.pickup_lat,
                pickup_lng=req.pickup_lng,
                pickup_name=req.pickup_name,
                pickup_phone=req.pickup_phone,
                delivery_address=req.delivery_address,
                delivery_lat=req.delivery_lat,
                delivery_lng=req.delivery_lng,
                delivery_name=req.delivery_name,
                delivery_phone=req.delivery_phone,
                delivery_instruction=req.delivery_instruction,
                amount=delivery.delivery_fee,
                vehicle_id=req.vehicle_id,
                parcel_amount=order.total,
            )

            delivery.kwik_order_id = result.get("unique_order_id")
            delivery.kwik_job_id = result.get("job_id")
            delivery.status = "dispatched"
            delivery.dispatched_at = datetime.utcnow()

            # Update order status
            order.status = "in_transit"
            order.delivery_fee = delivery.delivery_fee

        except Exception as e:
            # If Kwik fails, still save the delivery as pending
            delivery.status = "pending"
            delivery.delivery_fee = 1500  # fallback estimate

    else:
        delivery.status = "pending"
        delivery.delivery_fee = 0

    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)

    return {
        "id": delivery.id,
        "order_id": delivery.order_id,
        "status": delivery.status,
        "kwik_order_id": delivery.kwik_order_id,
        "delivery_fee": delivery.delivery_fee,
        "pickup_address": delivery.pickup_address,
        "delivery_address": delivery.delivery_address,
    }


@router.get("/track/{order_id}")
async def track_delivery(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Track a delivery by order ID."""
    result = await db.execute(
        select(Delivery).where(Delivery.order_id == order_id)
    )
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="No delivery found for this order")

    if delivery.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    response = {
        "id": delivery.id,
        "order_id": delivery.order_id,
        "status": delivery.status,
        "delivery_fee": delivery.delivery_fee,
        "pickup_address": delivery.pickup_address,
        "delivery_address": delivery.delivery_address,
        "delivery_name": delivery.delivery_name,
        "dispatched_at": delivery.dispatched_at,
        "picked_up_at": delivery.picked_up_at,
        "delivered_at": delivery.delivered_at,
    }

    # If dispatched to Kwik, get real-time status
    if delivery.kwik_order_id and settings.KWIK_EMAIL:
        try:
            kwik_status = await kwik_service.track_delivery(delivery.kwik_order_id)
            response["kwik_status"] = kwik_status["status"]
            response["kwik_raw"] = kwik_status.get("raw")

            # Sync status back to our DB
            status_mapping = {
                "upcoming": "dispatched",
                "started": "in_transit",
                "accepted": "in_transit",
                "arrived": "in_transit",
                "ended": "delivered",
                "failed": "failed",
                "cancelled": "cancelled",
            }
            new_status = status_mapping.get(kwik_status["status"])
            if new_status and new_status != delivery.status:
                delivery.status = new_status
                if new_status == "delivered":
                    delivery.delivered_at = datetime.utcnow()
                    # Also update order
                    order_result = await db.execute(select(Order).where(Order.id == order_id))
                    order = order_result.scalars().first()
                    if order:
                        order.status = "delivered"
                await db.commit()

        except Exception as e:
            response["kwik_error"] = str(e)

    return response


@router.post("/cancel/{order_id}")
async def cancel_delivery(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a delivery."""
    result = await db.execute(
        select(Delivery).where(Delivery.order_id == order_id)
    )
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="No delivery found for this order")

    if delivery.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if delivery.status in ("delivered", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel delivery in '{delivery.status}' status")

    # Cancel on Kwik if dispatched
    if delivery.kwik_job_id and settings.KWIK_EMAIL:
        try:
            await kwik_service.cancel_delivery(delivery.kwik_job_id)
        except Exception:
            pass  # Still cancel locally even if Kwik fails

    delivery.status = "cancelled"
    await db.commit()

    return {"status": "cancelled", "order_id": order_id}
