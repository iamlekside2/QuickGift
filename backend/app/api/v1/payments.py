import uuid
import hashlib
import hmac

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.payment import Payment
from app.models.order import Order
from app.models.booking import Booking
from app.schemas.payment import InitializePayment, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/initialize")
async def initialize_payment(
    req: InitializePayment,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reference = f"QG-PAY-{uuid.uuid4().hex[:12].upper()}"

    payment = Payment(
        user_id=current_user["user_id"],
        reference=reference,
        order_id=req.order_id,
        booking_id=req.booking_id,
        amount=req.amount,
    )
    db.add(payment)
    await db.commit()

    # Initialize with Paystack
    if settings.PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "email": req.email,
                    "amount": int(req.amount * 100),  # Paystack uses kobo
                    "reference": reference,
                    "callback_url": req.callback_url or "https://quickgift.ng/payment/callback",
                    "currency": "NGN",
                    "metadata": {
                        "order_id": req.order_id,
                        "booking_id": req.booking_id,
                        "user_id": current_user["user_id"],
                    },
                },
                headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            )

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "reference": reference,
                    "authorization_url": data["data"]["authorization_url"],
                    "access_code": data["data"]["access_code"],
                }

    # Fallback for dev (no Paystack key)
    return {
        "reference": reference,
        "authorization_url": None,
        "message": "Payment initialized (dev mode - no Paystack key configured)",
    }


@router.post("/verify/{reference}")
async def verify_payment(
    reference: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payment).where(Payment.reference == reference))
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if settings.PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            )

            if resp.status_code == 200:
                data = resp.json()["data"]
                payment.status = "success" if data["status"] == "success" else "failed"
                payment.channel = data.get("channel")

                # Update order/booking payment status
                if payment.status == "success":
                    if payment.order_id:
                        order = await db.execute(select(Order).where(Order.id == payment.order_id))
                        order = order.scalars().first()
                        if order:
                            order.payment_status = "paid"
                            order.payment_ref = reference
                            order.status = "confirmed"

                    if payment.booking_id:
                        booking = await db.execute(select(Booking).where(Booking.id == payment.booking_id))
                        booking = booking.scalars().first()
                        if booking:
                            booking.payment_status = "paid"
                            booking.payment_ref = reference
                            booking.status = "confirmed"

                await db.commit()
                await db.refresh(payment)
                return {"status": payment.status, "reference": reference}

    # Dev mode: auto-succeed
    payment.status = "success"
    if payment.order_id:
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalars().first()
        if order:
            order.payment_status = "paid"
            order.payment_ref = reference
            order.status = "confirmed"

    if payment.booking_id:
        booking_result = await db.execute(select(Booking).where(Booking.id == payment.booking_id))
        booking = booking_result.scalars().first()
        if booking:
            booking.payment_status = "paid"
            booking.payment_ref = reference
            booking.status = "confirmed"

    await db.commit()
    return {"status": "success", "reference": reference, "message": "Dev mode auto-verified"}


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()

    # Verify signature
    if settings.PAYSTACK_SECRET_KEY:
        signature = request.headers.get("x-paystack-signature", "")
        expected = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode(),
            body,
            hashlib.sha512,
        ).hexdigest()
        if signature != expected:
            raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    event = data.get("event")

    if event == "charge.success":
        reference = data["data"]["reference"]
        result = await db.execute(select(Payment).where(Payment.reference == reference))
        payment = result.scalars().first()

        if payment and payment.status != "success":
            payment.status = "success"
            payment.channel = data["data"].get("channel")

            if payment.order_id:
                order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
                order = order_result.scalars().first()
                if order:
                    order.payment_status = "paid"
                    order.payment_ref = reference
                    order.status = "confirmed"

            if payment.booking_id:
                booking_result = await db.execute(select(Booking).where(Booking.id == payment.booking_id))
                booking = booking_result.scalars().first()
                if booking:
                    booking.payment_status = "paid"
                    booking.payment_ref = reference
                    booking.status = "confirmed"

            await db.commit()

    return {"status": "ok"}
