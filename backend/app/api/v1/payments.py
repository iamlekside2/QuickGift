import uuid
import hashlib
import hmac
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.payment import Payment
from app.models.order import Order, OrderItem
from app.models.booking import Booking
from app.models.user import User
from app.models.transaction import Transaction
from app.models.payout import Payout
from app.models.provider import Provider
from app.models.product import Product
from app.schemas.payment import InitializePayment, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


async def _create_payout_for_order(order: Order, db: AsyncSession):
    """Create payout records for each provider involved in the order."""
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    for item in items:
        product_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = product_result.scalars().first()
        if not product:
            continue

        commission = item.total_price * (settings.GIFT_COMMISSION_PERCENT / 100)
        provider_amount = item.total_price - commission

        # Find the actual provider by vendor_id, or skip payout if no linked provider
        if product.vendor_id:
            provider_result = await db.execute(
                select(Provider).where(Provider.id == product.vendor_id)
            )
            provider = provider_result.scalars().first()
            if provider:
                payout = Payout(
                    provider_id=provider.id,
                    user_id=provider.user_id,
                    order_id=order.id,
                    amount=provider_amount,
                    commission=commission,
                    status="held",
                    hold_until=datetime.utcnow() + timedelta(hours=settings.PAYOUT_HOLD_HOURS),
                )
                db.add(payout)


async def _create_payout_for_booking(booking: Booking, db: AsyncSession):
    """Create payout record for the provider of a booking."""
    # Find the provider's user_id
    provider_result = await db.execute(
        select(Provider).where(Provider.id == booking.provider_id)
    )
    provider = provider_result.scalars().first()
    if not provider:
        return

    commission = booking.price * (settings.BEAUTY_COMMISSION_PERCENT / 100)
    provider_amount = booking.price - commission

    payout = Payout(
        provider_id=booking.provider_id,
        user_id=provider.user_id,
        order_id=None,
        booking_id=booking.id,
        amount=provider_amount,
        commission=commission,
        status="held",
        hold_until=datetime.utcnow() + timedelta(hours=settings.PAYOUT_HOLD_HOURS),
    )
    db.add(payout)


async def _process_successful_payment(payment: Payment, db: AsyncSession):
    """Handle post-payment: update order/booking, create payouts."""
    if payment.order_id:
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalars().first()
        if order:
            order.payment_status = "paid"
            order.payment_ref = payment.reference
            order.status = "confirmed"
            await _create_payout_for_order(order, db)

    if payment.booking_id:
        booking_result = await db.execute(select(Booking).where(Booking.id == payment.booking_id))
        booking = booking_result.scalars().first()
        if booking:
            booking.payment_status = "paid"
            booking.payment_ref = payment.reference
            booking.status = "confirmed"
            await _create_payout_for_booking(booking, db)


@router.post("/initialize")
async def initialize_payment(
    req: InitializePayment,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize a payment. Supports 'card' (Paystack) or 'wallet' methods."""
    reference = f"QG-PAY-{uuid.uuid4().hex[:12].upper()}"
    method = getattr(req, "method", "card") or "card"

    payment = Payment(
        user_id=current_user["user_id"],
        reference=reference,
        order_id=req.order_id,
        booking_id=req.booking_id,
        amount=req.amount,
        channel=method,
    )
    db.add(payment)
    await db.flush()

    # ── Wallet payment ──────────────────────────────────────────
    if method == "wallet":
        user_result = await db.execute(
            select(User).where(User.id == current_user["user_id"])
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.wallet_balance < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        # Debit wallet
        user.wallet_balance -= req.amount

        # Record transaction
        tx = Transaction(
            user_id=user.id,
            type="debit",
            amount=req.amount,
            description=f"Payment for order {req.order_id or req.booking_id}",
            reference=reference,
            balance_after=user.wallet_balance,
            status="completed",
        )
        db.add(tx)

        # Mark payment as success
        payment.status = "success"
        payment.channel = "wallet"

        # Process order/booking updates and create payouts
        await _process_successful_payment(payment, db)

        await db.commit()
        return {
            "reference": reference,
            "status": "success",
            "method": "wallet",
            "new_balance": user.wallet_balance,
        }

    # ── Card payment (Paystack) ─────────────────────────────────
    if settings.PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "email": req.email or f"{current_user['user_id']}@quickgift.ng",
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
                await db.commit()
                return {
                    "reference": reference,
                    "authorization_url": data["data"]["authorization_url"],
                    "access_code": data["data"]["access_code"],
                }

    # Fallback for dev (no Paystack key)
    await db.commit()
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

    # Already processed (e.g. wallet payment)
    if payment.status == "success":
        return {"status": "success", "reference": reference}

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

                if payment.status == "success":
                    await _process_successful_payment(payment, db)

                await db.commit()
                await db.refresh(payment)
                return {"status": payment.status, "reference": reference}

    # Dev mode: auto-succeed
    payment.status = "success"
    await _process_successful_payment(payment, db)
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
            await _process_successful_payment(payment, db)
            await db.commit()

    return {"status": "ok"}
