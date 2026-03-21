import random
import string
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.config import settings
from app.core.push import send_push
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderDetailResponse,
    OrderItemResponse, OrderStatusUpdate,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number():
    return "QG-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@router.post("", response_model=OrderResponse)
async def create_order(
    req: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtotal = 0.0
    items_data = []

    # Batch-fetch all products in one query (fixes N+1)
    product_ids = [item.product_id for item in req.items]
    products_result = await db.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products_map = {p.id: p for p in products_result.scalars().all()}

    for item in req.items:
        product = products_map.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.status != "active":
            raise HTTPException(status_code=400, detail=f'"{product.name}" is currently unavailable')

        item_total = product.price * item.quantity
        subtotal += item_total
        items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "vendor_name": product.vendor_name,
            "quantity": item.quantity,
            "unit_price": product.price,
            "total_price": item_total,
        })

    # Calculate delivery fee
    delivery_fee = settings.DELIVERY_BASE_FEE
    if req.is_express:
        delivery_fee *= settings.EXPRESS_MULTIPLIER

    commission = subtotal * (settings.GIFT_COMMISSION_PERCENT / 100)
    total = subtotal + delivery_fee

    order = Order(
        order_number=generate_order_number(),
        user_id=current_user["user_id"],
        order_type="gift",
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        commission=commission,
        total=total,
        delivery_address=req.delivery_address,
        delivery_city=req.delivery_city,
        recipient_name=req.recipient_name,
        recipient_phone=req.recipient_phone,
        personal_message=req.personal_message,
        is_anonymous=req.is_anonymous,
        is_express=req.is_express,
        scheduled_date=req.scheduled_date,
    )
    db.add(order)
    await db.flush()

    for item_data in items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

    await db.commit()
    await db.refresh(order)
    return order


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[str] = None,
    order_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == current_user["user_id"])

    if status:
        query = query.where(Order.status == status)
    if order_type:
        query = query.where(Order.order_type == order_type)

    query = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an order and refund if paid."""
    from app.models.payment import Payment
    from app.models.transaction import Transaction
    from app.models.payout import Payout
    import uuid as _uuid

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in '{order.status}' status")

    order.status = "cancelled"
    refunded = False

    # Refund if order was paid
    if order.payment_status == "paid":
        order.payment_status = "refunded"

        # Refund to wallet
        user_result = await db.execute(select(User).where(User.id == order.user_id))
        buyer = user_result.scalars().first()
        if buyer:
            buyer.wallet_balance += order.total
            ref = f"RFD-{_uuid.uuid4().hex[:12].upper()}"
            db.add(Transaction(
                user_id=buyer.id,
                type="credit",
                amount=order.total,
                description=f"Refund for cancelled order {order.order_number}",
                reference=ref,
                balance_after=buyer.wallet_balance,
                status="completed",
            ))
            refunded = True

        # Cancel associated payouts
        payouts_result = await db.execute(
            select(Payout).where(Payout.order_id == order_id, Payout.status.in_(["pending", "held"]))
        )
        for payout in payouts_result.scalars().all():
            payout.status = "cancelled"

        # Mark payment as refunded
        if order.payment_ref:
            pay_result = await db.execute(
                select(Payment).where(Payment.reference == order.payment_ref)
            )
            payment = pay_result.scalars().first()
            if payment:
                payment.status = "refunded"

    await db.commit()
    return {
        "status": "cancelled",
        "order_id": order_id,
        "refunded": refunded,
        "refund_amount": order.total if refunded else 0,
    }


@router.get("/my-vendor-orders")
async def list_vendor_orders(
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders containing the current provider's products."""
    from app.models.provider import Provider

    # Find provider
    prov_result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = prov_result.scalars().first()
    if not provider:
        return []

    # Find order IDs that contain this provider's products
    from app.models.product import Product
    order_ids_query = (
        select(OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(Product.vendor_id == provider.id)
        .distinct()
    )
    order_ids_result = await db.execute(order_ids_query)
    order_ids = [row[0] for row in order_ids_result.all()]

    if not order_ids:
        return []

    query = select(Order).where(Order.id.in_(order_ids))
    if status:
        query = query.where(Order.status == status)
    query = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{order_id}/provider-status")
async def provider_update_order_status(
    order_id: str,
    req: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Provider updates order status (confirmed -> in_transit, in_transit -> delivered)."""
    from app.models.provider import Provider
    from app.models.product import Product

    # Verify this provider owns products in this order
    prov_result = await db.execute(
        select(Provider).where(Provider.user_id == current_user["user_id"])
    )
    provider = prov_result.scalars().first()
    if not provider:
        raise HTTPException(status_code=403, detail="Not a provider")

    # Check order has their products
    has_items = await db.execute(
        select(OrderItem.id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(OrderItem.order_id == order_id, Product.vendor_id == provider.id)
    )
    if not has_items.scalars().first():
        raise HTTPException(status_code=403, detail="This order doesn't contain your products")

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    provider_transitions = {
        "confirmed": ["in_transit"],
        "in_transit": ["delivered"],
    }

    if req.status not in provider_transitions.get(order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status} to {req.status}",
        )

    order.status = req.status
    await db.commit()
    await db.refresh(order)

    # Notify buyer
    buyer_result = await db.execute(select(User).where(User.id == order.user_id))
    buyer = buyer_result.scalars().first()
    if buyer and buyer.push_token:
        status_label = req.status.replace("_", " ").title()
        await send_push(
            buyer.push_token,
            f"Order {status_label}",
            f"Your order {order.order_number} is now {status_label.lower()}",
            {"type": "order_status", "order_id": order.id, "status": req.status},
        )

    return order


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check ownership or admin
    if order.user_id != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = items_result.scalars().all()

    return OrderDetailResponse(
        **{c.name: getattr(order, c.name) for c in order.__table__.columns},
        items=items,
    )


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    req: OrderStatusUpdate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["in_transit", "cancelled"],
        "in_transit": ["delivered"],
        "delivered": [],
        "cancelled": [],
    }

    if req.status not in valid_transitions.get(order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status} to {req.status}",
        )

    order.status = req.status
    await db.commit()
    await db.refresh(order)

    # Push notification to buyer about order status change
    buyer_result = await db.execute(select(User).where(User.id == order.user_id))
    buyer = buyer_result.scalars().first()
    if buyer and buyer.push_token:
        status_label = req.status.replace("_", " ").title()
        await send_push(
            buyer.push_token,
            f"Order {status_label}",
            f"Your order {order.order_number} is now {status_label.lower()}",
            {"type": "order_status", "order_id": order.id, "status": req.status},
        )

    return order
