from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.product import Product, Category, Occasion
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductListResponse, CategoryCreate, CategoryResponse, OccasionResponse,
)

router = APIRouter(prefix="/products", tags=["Products & Gifts"])


# --- Categories ---

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.sort_order)
    )
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    req: CategoryCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = Category(**req.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


# --- Occasions ---

@router.get("/occasions", response_model=List[OccasionResponse])
async def list_occasions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Occasion).where(Occasion.is_active == True).order_by(Occasion.sort_order)
    )
    return result.scalars().all()


# --- Products ---

@router.get("", response_model=ProductListResponse)
async def list_products(
    category_id: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: str = Query("popular", pattern="^(popular|price_asc|price_desc|rating|newest)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.status == "active")

    if category_id:
        query = query.where(Product.category_id == category_id)
    if city:
        query = query.where(Product.city == city)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if featured is not None:
        query = query.where(Product.is_featured == featured)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Sort
    if sort == "popular":
        query = query.order_by(Product.order_count.desc())
    elif sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)

    return ProductListResponse(
        items=result.scalars().all(),
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse)
async def create_product(
    req: ProductCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    product = Product(**req.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    req: ProductUpdate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted"}
