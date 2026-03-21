from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.notify import notify_user
from app.models.review import Review
from app.models.user import User
from app.models.product import Product
from app.models.provider import Provider

router = APIRouter(prefix="/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    target_type: str  # product, provider
    target_id: str
    rating: float
    comment: Optional[str] = None
    order_id: Optional[str] = None
    booking_id: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    target_type: str
    target_id: str
    order_id: Optional[str] = None
    booking_id: Optional[str] = None
    rating: float
    comment: Optional[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ReviewResponse)
async def create_review(
    req: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Prevent self-review for providers
    if req.target_type == "provider":
        prov = await db.execute(select(Provider).where(Provider.id == req.target_id))
        provider = prov.scalars().first()
        if provider and provider.user_id == current_user["user_id"]:
            raise HTTPException(status_code=400, detail="You cannot review yourself")

    # Check for duplicate review (one per user per target)
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user["user_id"],
            Review.target_type == req.target_type,
            Review.target_id == req.target_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="You have already reviewed this item")

    # Get user name
    user_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = user_result.scalars().first()

    review = Review(
        user_id=current_user["user_id"],
        user_name=user.full_name if user else "User",
        target_type=req.target_type,
        target_id=req.target_id,
        order_id=req.order_id,
        booking_id=req.booking_id,
        rating=req.rating,
        comment=req.comment,
    )
    db.add(review)
    await db.flush()  # Flush first so the new review is included in aggregation

    # Update target's average rating (AFTER adding the review)
    if req.target_type == "product":
        avg = (await db.execute(
            select(func.avg(Review.rating)).where(
                Review.target_type == "product", Review.target_id == req.target_id
            )
        )).scalar()
        count = (await db.execute(
            select(func.count(Review.id)).where(
                Review.target_type == "product", Review.target_id == req.target_id
            )
        )).scalar()

        product = (await db.execute(select(Product).where(Product.id == req.target_id))).scalars().first()
        if product:
            product.rating = round(avg or req.rating, 1)
            product.review_count = count or 1

    elif req.target_type == "provider":
        avg = (await db.execute(
            select(func.avg(Review.rating)).where(
                Review.target_type == "provider", Review.target_id == req.target_id
            )
        )).scalar()
        count = (await db.execute(
            select(func.count(Review.id)).where(
                Review.target_type == "provider", Review.target_id == req.target_id
            )
        )).scalar()

        provider = (await db.execute(select(Provider).where(Provider.id == req.target_id))).scalars().first()
        if provider:
            provider.rating = round(avg or req.rating, 1)
            provider.review_count = count or 1

    # Notify the provider/product owner about the new review
    reviewer_name = user.full_name if user else "A customer"
    star_text = "⭐" * int(req.rating)
    if req.target_type == "provider" and provider:
        await notify_user(
            provider.user_id,
            "New Review!",
            f"{reviewer_name} left a {star_text} review" + (f": \"{req.comment[:50]}\"" if req.comment else ""),
            "review",
            {"type": "new_review", "review_id": review.id},
            db,
        )
    elif req.target_type == "product" and product:
        # Notify product vendor if they have a vendor_id
        if product.vendor_id:
            vendor_prov = (await db.execute(select(Provider).where(Provider.id == product.vendor_id))).scalars().first()
            if vendor_prov:
                await notify_user(
                    vendor_prov.user_id,
                    "New Product Review!",
                    f"{reviewer_name} reviewed {product.name} {star_text}",
                    "review",
                    {"type": "new_review", "review_id": review.id},
                    db,
                )

    await db.commit()
    await db.refresh(review)
    return review


@router.get("/{target_type}/{target_id}")
async def list_reviews(
    target_type: str,
    target_id: str,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.target_type == target_type, Review.target_id == target_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return result.scalars().all()


# --- Admin moderation ---

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin deletes a review and recalculates target rating."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    target_type = review.target_type
    target_id = review.target_id

    await db.delete(review)
    await db.flush()

    # Recalculate rating after deletion
    avg = (await db.execute(
        select(func.avg(Review.rating)).where(
            Review.target_type == target_type, Review.target_id == target_id
        )
    )).scalar()
    count = (await db.execute(
        select(func.count(Review.id)).where(
            Review.target_type == target_type, Review.target_id == target_id
        )
    )).scalar()

    if target_type == "product":
        product = (await db.execute(select(Product).where(Product.id == target_id))).scalars().first()
        if product:
            product.rating = round(avg or 0, 1)
            product.review_count = count or 0
    elif target_type == "provider":
        provider = (await db.execute(select(Provider).where(Provider.id == target_id))).scalars().first()
        if provider:
            provider.rating = round(avg or 0, 1)
            provider.review_count = count or 0

    await db.commit()
    return {"message": "Review deleted", "review_id": review_id}
