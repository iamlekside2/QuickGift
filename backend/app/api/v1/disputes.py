"""Dispute system: buyer raises, provider responds, admin resolves."""

import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.notify import notify_user
from app.models.dispute import Dispute
from app.models.order import Order
from app.models.booking import Booking
from app.models.user import User
from app.models.transaction import Transaction
from app.models.payout import Payout

router = APIRouter(prefix="/disputes", tags=["Disputes"])


# ── Schemas ──────────────────────────────────────────────

class RaiseDisputeRequest(BaseModel):
    order_id: Optional[str] = None
    booking_id: Optional[str] = None
    reason: str  # not_received, wrong_item, poor_quality, unresponsive, other
    description: Optional[str] = None
    evidence_urls: Optional[List[str]] = None


class ProviderRespondRequest(BaseModel):
    response: str
    evidence_urls: Optional[List[str]] = None


class ResolveDisputeRequest(BaseModel):
    resolution: str  # buyer or provider
    notes: Optional[str] = None
    refund_amount: Optional[float] = None


# ── Buyer: Raise a dispute ───────────────────────────────

@router.post("")
async def raise_dispute(
    req: RaiseDisputeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Buyer raises a dispute on an order or booking."""
    if not req.order_id and not req.booking_id:
        raise HTTPException(status_code=400, detail="Must provide order_id or booking_id")

    # Verify ownership
    provider_id = None
    if req.order_id:
        order = (await db.execute(select(Order).where(Order.id == req.order_id))).scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not your order")
    if req.booking_id:
        booking = (await db.execute(select(Booking).where(Booking.id == req.booking_id))).scalars().first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not your booking")
        provider_id = booking.provider_id

    # Check for existing open dispute
    existing = await db.execute(
        select(Dispute).where(
            Dispute.buyer_id == current_user["user_id"],
            Dispute.order_id == req.order_id if req.order_id else Dispute.booking_id == req.booking_id,
            Dispute.status.in_(["open", "provider_responded"]),
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="An open dispute already exists for this order")

    import json
    dispute = Dispute(
        order_id=req.order_id,
        booking_id=req.booking_id,
        buyer_id=current_user["user_id"],
        provider_id=provider_id,
        reason=req.reason,
        description=req.description,
        evidence_urls=json.dumps(req.evidence_urls) if req.evidence_urls else None,
    )
    db.add(dispute)

    # Notify provider
    if provider_id:
        from app.models.provider import Provider
        prov = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalars().first()
        if prov:
            await notify_user(
                prov.user_id, "Dispute Raised",
                f"A buyer has raised a dispute. Reason: {req.reason}. Please respond.",
                "system", {"type": "dispute", "dispute_id": dispute.id}, db,
            )

    await db.commit()
    await db.refresh(dispute)
    return dispute


# ── Buyer/Provider: List my disputes ─────────────────────

@router.get("")
async def list_my_disputes(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List disputes for the current user (buyer or provider)."""
    query = select(Dispute).where(
        (Dispute.buyer_id == current_user["user_id"]) |
        (Dispute.provider_id == current_user.get("provider_id"))
    )
    if status:
        query = query.where(Dispute.status == status)
    query = query.order_by(Dispute.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


# ── Provider: Respond to dispute ─────────────────────────

@router.patch("/{dispute_id}/respond")
async def respond_to_dispute(
    dispute_id: str,
    req: ProviderRespondRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Provider responds to a dispute raised against them."""
    dispute = (await db.execute(select(Dispute).where(Dispute.id == dispute_id))).scalars().first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status not in ("open",):
        raise HTTPException(status_code=400, detail="Cannot respond to this dispute")

    import json
    dispute.provider_response = req.response
    dispute.provider_evidence_urls = json.dumps(req.evidence_urls) if req.evidence_urls else None
    dispute.status = "provider_responded"

    # Notify buyer
    await notify_user(
        dispute.buyer_id, "Dispute Updated",
        "The provider has responded to your dispute. An admin will review shortly.",
        "system", {"type": "dispute", "dispute_id": dispute_id}, db,
    )

    await db.commit()
    return {"status": "provider_responded", "dispute_id": dispute_id}


# ── Admin: List all disputes ─────────────────────────────

@router.get("/admin/all")
async def admin_list_disputes(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all disputes."""
    query = select(Dispute)
    if status:
        query = query.where(Dispute.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    query = query.order_by(Dispute.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)

    return {"items": result.scalars().all(), "total": total, "page": page, "per_page": per_page}


# ── Admin: Get dispute detail ────────────────────────────

@router.get("/admin/{dispute_id}")
async def admin_get_dispute(
    dispute_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: get full dispute details with both sides."""
    dispute = (await db.execute(select(Dispute).where(Dispute.id == dispute_id))).scalars().first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    # Get buyer and provider names
    buyer = (await db.execute(select(User).where(User.id == dispute.buyer_id))).scalars().first()

    import json
    return {
        **{c.name: getattr(dispute, c.name) for c in dispute.__table__.columns},
        "buyer_name": buyer.full_name if buyer else "Unknown",
        "evidence_urls": json.loads(dispute.evidence_urls) if dispute.evidence_urls else [],
        "provider_evidence_urls": json.loads(dispute.provider_evidence_urls) if dispute.provider_evidence_urls else [],
    }


# ── Admin: Resolve dispute ───────────────────────────────

@router.patch("/admin/{dispute_id}/resolve")
async def admin_resolve_dispute(
    dispute_id: str,
    req: ResolveDisputeRequest,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin resolves a dispute in favor of buyer or provider."""
    dispute = (await db.execute(select(Dispute).where(Dispute.id == dispute_id))).scalars().first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status in ("resolved_buyer", "resolved_provider", "closed"):
        raise HTTPException(status_code=400, detail="Dispute already resolved")

    dispute.resolved_by = admin["user_id"]
    dispute.resolution_notes = req.notes

    if req.resolution == "buyer":
        dispute.status = "resolved_buyer"

        # Determine refund amount
        refund_amount = req.refund_amount or 0
        if not refund_amount:
            if dispute.order_id:
                order = (await db.execute(select(Order).where(Order.id == dispute.order_id))).scalars().first()
                if order:
                    refund_amount = order.total
            elif dispute.booking_id:
                booking = (await db.execute(select(Booking).where(Booking.id == dispute.booking_id))).scalars().first()
                if booking:
                    refund_amount = booking.price

        dispute.refund_amount = refund_amount

        # Credit buyer wallet
        if refund_amount > 0:
            buyer = (await db.execute(select(User).where(User.id == dispute.buyer_id))).scalars().first()
            if buyer:
                buyer.wallet_balance += refund_amount
                ref = f"DRF-{uuid.uuid4().hex[:12].upper()}"
                db.add(Transaction(
                    user_id=buyer.id, type="credit", amount=refund_amount,
                    description=f"Dispute refund",
                    reference=ref, balance_after=buyer.wallet_balance, status="completed",
                ))

            # Cancel associated payouts
            if dispute.order_id:
                payouts = (await db.execute(
                    select(Payout).where(Payout.order_id == dispute.order_id, Payout.status.in_(["pending", "held"]))
                )).scalars().all()
                for p in payouts:
                    p.status = "cancelled"

        # Notify buyer
        await notify_user(
            dispute.buyer_id, "Dispute Resolved",
            f"Your dispute has been resolved in your favor. ₦{refund_amount:,.0f} refunded to your wallet.",
            "payment", {"type": "dispute_resolved", "dispute_id": dispute_id}, db,
        )

    elif req.resolution == "provider":
        dispute.status = "resolved_provider"
        dispute.refund_amount = 0

        # Notify buyer
        await notify_user(
            dispute.buyer_id, "Dispute Resolved",
            "Your dispute has been reviewed and resolved in favor of the provider.",
            "system", {"type": "dispute_resolved", "dispute_id": dispute_id}, db,
        )

    # Notify provider of resolution
    if dispute.provider_id:
        from app.models.provider import Provider
        prov = (await db.execute(select(Provider).where(Provider.id == dispute.provider_id))).scalars().first()
        if prov:
            outcome = "in your favor" if req.resolution == "provider" else "in favor of the buyer"
            await notify_user(
                prov.user_id, "Dispute Resolved",
                f"A dispute has been resolved {outcome}.",
                "system", {"type": "dispute_resolved", "dispute_id": dispute_id}, db,
            )

    await db.commit()
    return {"status": dispute.status, "refund_amount": dispute.refund_amount}
