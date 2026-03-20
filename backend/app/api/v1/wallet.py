import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import FundWalletRequest, TransferRequest, TransactionResponse

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/balance")
async def get_balance(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"balance": user.wallet_balance}


@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    query = (
        select(Transaction)
        .where(Transaction.user_id == current_user["user_id"])
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/fund", response_model=TransactionResponse)
async def fund_wallet(
    req: FundWalletRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Check for duplicate reference
    existing = await db.execute(
        select(Transaction).where(Transaction.reference == req.reference)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Duplicate reference")

    # Get user and update balance
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.wallet_balance += req.amount
    new_balance = user.wallet_balance

    transaction = Transaction(
        user_id=current_user["user_id"],
        type="credit",
        amount=req.amount,
        description="Wallet funding",
        reference=req.reference,
        balance_after=new_balance,
        status="completed",
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.post("/transfer", response_model=TransactionResponse)
async def transfer(
    req: TransferRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Get sender
    sender_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    sender = sender_result.scalars().first()
    if not sender:
        raise HTTPException(status_code=404, detail="User not found")

    if sender.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Get recipient by phone
    recipient_result = await db.execute(
        select(User).where(User.phone == req.recipient_phone)
    )
    recipient = recipient_result.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if recipient.id == sender.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    ref = f"TRF-{uuid.uuid4().hex[:12].upper()}"

    # Debit sender
    sender.wallet_balance -= req.amount
    debit_tx = Transaction(
        user_id=sender.id,
        type="debit",
        amount=req.amount,
        description=f"Transfer to {recipient.full_name}",
        reference=ref,
        balance_after=sender.wallet_balance,
        status="completed",
    )
    db.add(debit_tx)

    # Credit recipient
    recipient.wallet_balance += req.amount
    credit_tx = Transaction(
        user_id=recipient.id,
        type="credit",
        amount=req.amount,
        description=f"Transfer from {sender.full_name}",
        reference=f"{ref}-CR",
        balance_after=recipient.wallet_balance,
        status="completed",
    )
    db.add(credit_tx)

    await db.commit()
    await db.refresh(debit_tx)
    return debit_tx
