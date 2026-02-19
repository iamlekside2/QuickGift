import random
import string
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.config import settings
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderDetailResponse,
    OrderItemResponse, OrderStatusUpdate,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number():
    return "QG-" + "".join(random.choices(string.digits, k=4))


@router.post("", response_model=OrderResponse)
async def create_order(
    req: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtotal = 0.0
    items_data = []

    for item in req.items:
        product_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = product_result.scalars().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

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
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == current_user["user_id"])

    if status:
        query = query.where(Order.status == status)
    if order_type:
        query = query.where(Order.order_type == order_type)

    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


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
    return order
