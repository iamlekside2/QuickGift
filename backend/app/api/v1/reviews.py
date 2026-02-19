from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
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


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    target_type: str
    target_id: str
    rating: float
    comment: Optional[str]
    created_at: str

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

    # Get user name
    user_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = user_result.scalars().first()

    review = Review(
        user_id=current_user["user_id"],
        user_name=user.full_name if user else "User",
        target_type=req.target_type,
        target_id=req.target_id,
        rating=req.rating,
        comment=req.comment,
    )
    db.add(review)

    # Update target's average rating
    if req.target_type == "product":
        avg = (await db.execute(
            select(func.avg(Review.rating)).where(Review.target_type == "product", Review.target_id == req.target_id)
        )).scalar()
        count = (await db.execute(
            select(func.count(Review.id)).where(Review.target_type == "product", Review.target_id == req.target_id)
        )).scalar()

        product = (await db.execute(select(Product).where(Product.id == req.target_id))).scalars().first()
        if product:
            product.rating = round(avg or req.rating, 1)
            product.review_count = (count or 0) + 1

    elif req.target_type == "provider":
        avg = (await db.execute(
            select(func.avg(Review.rating)).where(Review.target_type == "provider", Review.target_id == req.target_id)
        )).scalar()
        count = (await db.execute(
            select(func.count(Review.id)).where(Review.target_type == "provider", Review.target_id == req.target_id)
        )).scalar()

        provider = (await db.execute(select(Provider).where(Provider.id == req.target_id))).scalars().first()
        if provider:
            provider.rating = round(avg or req.rating, 1)
            provider.review_count = (count or 0) + 1

    await db.commit()
    await db.refresh(review)
    return review


@router.get("/{target_type}/{target_id}")
async def list_reviews(
    target_type: str,
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.target_type == target_type, Review.target_id == target_id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()
