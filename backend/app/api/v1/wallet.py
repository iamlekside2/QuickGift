import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.transaction import Transaction
from app.models.bank_account import BankAccount
from app.schemas.transaction import FundWalletRequest, TransferRequest, TransactionResponse

router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ── Schemas ──────────────────────────────────────────────

class AddBankAccountRequest(BaseModel):
    bank_name: str
    bank_code: str
    account_number: str
    account_name: str
    is_default: bool = False


class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    bank_code: str
    account_number: str
    account_name: str
    is_default: bool
    is_verified: bool

    class Config:
        from_attributes = True


class WithdrawRequest(BaseModel):
    amount: float
    bank_account_id: str


# Nigerian banks for validation / display
NIGERIAN_BANKS = [
    {"name": "Access Bank", "code": "044"},
    {"name": "Citibank Nigeria", "code": "023"},
    {"name": "Ecobank Nigeria", "code": "050"},
    {"name": "Fidelity Bank", "code": "070"},
    {"name": "First Bank of Nigeria", "code": "011"},
    {"name": "First City Monument Bank", "code": "214"},
    {"name": "Globus Bank", "code": "00103"},
    {"name": "Guaranty Trust Bank", "code": "058"},
    {"name": "Heritage Bank", "code": "030"},
    {"name": "Jaiz Bank", "code": "301"},
    {"name": "Keystone Bank", "code": "082"},
    {"name": "Kuda Bank", "code": "50211"},
    {"name": "Lotus Bank", "code": "303"},
    {"name": "Moniepoint", "code": "50515"},
    {"name": "OPay", "code": "999992"},
    {"name": "PalmPay", "code": "999991"},
    {"name": "Polaris Bank", "code": "076"},
    {"name": "Providus Bank", "code": "101"},
    {"name": "Stanbic IBTC Bank", "code": "221"},
    {"name": "Standard Chartered", "code": "068"},
    {"name": "Sterling Bank", "code": "232"},
    {"name": "SunTrust Bank", "code": "100"},
    {"name": "TAJ Bank", "code": "302"},
    {"name": "Titan Trust Bank", "code": "102"},
    {"name": "Union Bank", "code": "032"},
    {"name": "United Bank for Africa", "code": "033"},
    {"name": "Unity Bank", "code": "215"},
    {"name": "VFD Microfinance Bank", "code": "566"},
    {"name": "Wema Bank", "code": "035"},
    {"name": "Zenith Bank", "code": "057"},
]


# ── Balance & Transactions ───────────────────────────────

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


# ── Fund ─────────────────────────────────────────────────

@router.post("/fund/initialize")
async def initialize_fund(
    amount: float = Query(..., gt=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize a Paystack payment to fund the wallet."""
    import uuid as _uuid
    reference = f"WF-{_uuid.uuid4().hex[:12].upper()}"

    if settings.PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "email": current_user.get("email") or f"{current_user['user_id']}@quickgift.ng",
                    "amount": int(amount * 100),
                    "reference": reference,
                    "currency": "NGN",
                    "metadata": {"type": "wallet_fund", "user_id": current_user["user_id"]},
                },
                headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "reference": reference,
                    "amount": amount,
                    "authorization_url": data["data"]["authorization_url"],
                    "access_code": data["data"]["access_code"],
                }

    # Dev mode fallback
    return {"reference": reference, "amount": amount, "authorization_url": None, "message": "Dev mode"}


@router.post("/fund/verify/{reference}")
async def verify_fund(
    reference: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify a Paystack payment and credit the wallet."""
    # Check duplicate
    existing = await db.execute(
        select(Transaction).where(Transaction.reference == reference)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already processed")

    amount = 0
    verified = False

    if settings.PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            )
            if resp.status_code == 200:
                data = resp.json()["data"]
                if data["status"] == "success":
                    amount = data["amount"] / 100  # kobo to naira
                    verified = True
    else:
        # Dev mode: auto-verify, extract amount from reference metadata
        amount = 5000  # dev fallback
        verified = True

    if not verified:
        raise HTTPException(status_code=400, detail="Payment not verified")

    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.wallet_balance += amount

    transaction = Transaction(
        user_id=current_user["user_id"],
        type="credit",
        amount=amount,
        description="Wallet funding via Paystack",
        reference=reference,
        balance_after=user.wallet_balance,
        status="completed",
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.post("/fund", response_model=TransactionResponse)
async def fund_wallet_legacy(
    req: FundWalletRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Legacy fund endpoint — kept for backward compatibility but requires admin role or dev mode."""
    # Only allow in dev mode or by admin
    if settings.PAYSTACK_SECRET_KEY and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Direct funding disabled. Use /fund/initialize instead.")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    existing = await db.execute(
        select(Transaction).where(Transaction.reference == req.reference)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Duplicate reference")

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


# ── Transfer ─────────────────────────────────────────────

@router.post("/transfer", response_model=TransactionResponse)
async def transfer(
    req: TransferRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    sender_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    sender = sender_result.scalars().first()
    if not sender:
        raise HTTPException(status_code=404, detail="User not found")

    if sender.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    recipient_result = await db.execute(
        select(User).where(User.phone == req.recipient_phone)
    )
    recipient = recipient_result.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if recipient.id == sender.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    ref = f"TRF-{uuid.uuid4().hex[:12].upper()}"

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


# ── Bank Accounts ────────────────────────────────────────

@router.get("/banks")
async def list_banks(
    current_user: dict = Depends(get_current_user),
):
    """List all supported Nigerian banks."""
    return NIGERIAN_BANKS


@router.get("/resolve-account")
async def resolve_bank_account(
    account_number: str = Query(..., min_length=10, max_length=10),
    bank_code: str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    """Verify a bank account number and return the account holder's name via Paystack."""
    if not settings.PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.PAYSTACK_BASE_URL}/bank/resolve",
            params={"account_number": account_number, "bank_code": bank_code},
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            timeout=15.0,
        )

    data = resp.json()
    if resp.status_code == 200 and data.get("status"):
        return {
            "account_name": data["data"]["account_name"],
            "account_number": data["data"]["account_number"],
            "bank_id": data["data"].get("bank_id"),
            "verified": True,
        }

    raise HTTPException(
        status_code=400,
        detail=data.get("message", "Could not verify account. Check the number and try again."),
    )


@router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BankAccount)
        .where(BankAccount.user_id == current_user["user_id"])
        .order_by(BankAccount.is_default.desc(), BankAccount.created_at.desc())
    )
    return result.scalars().all()


@router.post("/bank-accounts", response_model=BankAccountResponse)
async def add_bank_account(
    req: AddBankAccountRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check for duplicate
    existing = await db.execute(
        select(BankAccount).where(
            BankAccount.user_id == current_user["user_id"],
            BankAccount.account_number == req.account_number,
            BankAccount.bank_code == req.bank_code,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This bank account already exists")

    # If setting as default, unset others
    if req.is_default:
        others = await db.execute(
            select(BankAccount).where(BankAccount.user_id == current_user["user_id"])
        )
        for acct in others.scalars().all():
            acct.is_default = False

    # If first account, auto-set as default
    count = await db.execute(
        select(func.count(BankAccount.id)).where(BankAccount.user_id == current_user["user_id"])
    )
    is_first = (count.scalar() or 0) == 0

    bank_account = BankAccount(
        user_id=current_user["user_id"],
        bank_name=req.bank_name,
        bank_code=req.bank_code,
        account_number=req.account_number,
        account_name=req.account_name,
        is_default=req.is_default or is_first,
        is_verified=True,  # TODO: verify via Paystack Resolve Account
    )
    db.add(bank_account)
    await db.commit()
    await db.refresh(bank_account)
    return bank_account


@router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BankAccount).where(
            BankAccount.id == account_id,
            BankAccount.user_id == current_user["user_id"],
        )
    )
    account = result.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    await db.delete(account)
    await db.commit()
    return {"status": "ok"}


@router.patch("/bank-accounts/{account_id}/default")
async def set_default_bank_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Unset all defaults
    all_accounts = await db.execute(
        select(BankAccount).where(BankAccount.user_id == current_user["user_id"])
    )
    for acct in all_accounts.scalars().all():
        acct.is_default = (acct.id == account_id)

    await db.commit()
    return {"status": "ok"}


# ── Withdraw ─────────────────────────────────────────────

@router.post("/withdraw", response_model=TransactionResponse)
async def withdraw(
    req: WithdrawRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    if req.amount < 500:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is ₦500")

    # Get user
    user_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Verify bank account belongs to user
    bank_result = await db.execute(
        select(BankAccount).where(
            BankAccount.id == req.bank_account_id,
            BankAccount.user_id == current_user["user_id"],
        )
    )
    bank_account = bank_result.scalars().first()
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    ref = f"WDR-{uuid.uuid4().hex[:12].upper()}"

    # Debit wallet
    user.wallet_balance -= req.amount

    transaction = Transaction(
        user_id=user.id,
        type="debit",
        amount=req.amount,
        description=f"Withdrawal to {bank_account.bank_name} ****{bank_account.account_number[-4:]}",
        reference=ref,
        balance_after=user.wallet_balance,
        status="pending",  # Pending until actually sent via Paystack Transfer
    )
    db.add(transaction)

    # TODO: Initiate Paystack Transfer API to send money to bank account
    # For now, mark as pending — admin can process manually or we auto-process later

    await db.commit()
    await db.refresh(transaction)
    return transaction
