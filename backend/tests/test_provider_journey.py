"""
End-to-end provider journey tests:
Register → onboard → get approved → receive order → fulfill → get paid → withdraw
"""

import pytest
from tests.conftest import (
    create_test_user, create_test_product, create_test_provider,
    create_test_admin, get_auth_token, auth_headers,
)


class TestProviderRegistration:
    """Register as provider and complete onboarding."""

    async def test_register_provider_profile(self, client, db):
        user = await create_test_user(db, phone="+2348055555555", role="provider")
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/providers", json={
            "business_name": "GlowUp Studio",
            "service_type": "Nails",
            "bio": "Professional nail tech",
            "location": "Lekki, Lagos",
            "city": "Lagos",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "GlowUp Studio"
        assert resp.json()["status"] == "pending"

    async def test_get_my_provider_profile(self, client, db):
        user, provider = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.get("/api/v1/providers/me", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Test Business"

    async def test_update_my_profile(self, client, db):
        user, provider = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.patch("/api/v1/providers/me", json={
            "bio": "Updated bio text",
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    async def test_add_service(self, client, db):
        user, provider = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/providers/me/services", json={
            "name": "Gel Manicure",
            "description": "Full gel manicure",
            "price": 5000,
            "duration_minutes": 60,
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Gel Manicure"


class TestProviderApproval:
    """Admin approves/rejects provider."""

    async def test_approve_provider(self, client, db):
        user, provider = await create_test_provider(db, phone="+2348066666666")
        from sqlalchemy import select
        from app.models.provider import Provider
        prov = (await db.execute(select(Provider).where(Provider.id == provider.id))).scalars().first()
        prov.status = "pending"
        await db.commit()

        admin = await create_test_admin(db)
        admin_token = await get_auth_token(client, admin.phone)

        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/approve",
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "verified"

    async def test_reject_provider_with_reason(self, client, db):
        user, provider = await create_test_provider(db, phone="+2348077777777")
        from sqlalchemy import select
        from app.models.provider import Provider
        prov = (await db.execute(select(Provider).where(Provider.id == provider.id))).scalars().first()
        prov.status = "pending"
        await db.commit()

        admin = await create_test_admin(db)
        admin_token = await get_auth_token(client, admin.phone)

        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/reject",
            json={"reason": "Incomplete documents"},
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"

    async def test_non_admin_cannot_approve(self, client, db):
        user, provider = await create_test_provider(db, phone="+2348088888888")
        buyer = await create_test_user(db, phone="+2348033333333")
        buyer_token = await get_auth_token(client, buyer.phone)

        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/approve",
            headers=auth_headers(buyer_token),
        )
        assert resp.status_code == 403


class TestProviderOrders:
    """Provider receives and fulfills orders."""

    async def test_provider_sees_vendor_orders(self, client, db):
        user, provider = await create_test_provider(db)
        product = await create_test_product(db, provider_id=provider.id)
        buyer = await create_test_user(db, phone="+2348044444444")
        buyer_token = await get_auth_token(client, buyer.phone)
        provider_token = await get_auth_token(client, user.phone)

        # Buyer places order
        await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(buyer_token))

        # Provider checks vendor orders
        resp = await client.get("/api/v1/orders/my-vendor-orders", headers=auth_headers(provider_token))
        assert resp.status_code == 200

    async def test_provider_updates_order_status(self, client, db):
        user, provider = await create_test_provider(db)
        product = await create_test_product(db, provider_id=provider.id)
        buyer = await create_test_user(db, phone="+2348055544444")
        buyer_token = await get_auth_token(client, buyer.phone)
        provider_token = await get_auth_token(client, user.phone)

        # Create and pay order
        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(buyer_token))
        order = order_resp.json()

        # Pay with wallet to confirm order
        await client.post("/api/v1/payments/initialize", json={
            "order_id": order["id"],
            "amount": order["total"],
            "method": "wallet",
        }, headers=auth_headers(buyer_token))

        # Provider marks as shipped
        resp = await client.patch(
            f"/api/v1/orders/{order['id']}/provider-status",
            json={"status": "in_transit"},
            headers=auth_headers(provider_token),
        )
        assert resp.status_code == 200


class TestProviderWallet:
    """Provider wallet and withdrawal."""

    async def test_check_balance(self, client, db):
        user, _ = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.get("/api/v1/wallet/balance", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "balance" in resp.json()

    async def test_add_bank_account(self, client, db):
        user, _ = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/wallet/bank-accounts", json={
            "bank_name": "GTBank",
            "bank_code": "058",
            "account_number": "0123456789",
            "account_name": "Test Provider",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["is_default"] == True

    async def test_withdraw(self, client, db):
        user, _ = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        # Add bank account first
        bank_resp = await client.post("/api/v1/wallet/bank-accounts", json={
            "bank_name": "GTBank",
            "bank_code": "058",
            "account_number": "0123456789",
            "account_name": "Test Provider",
        }, headers=auth_headers(token))
        bank = bank_resp.json()

        # Withdraw
        resp = await client.post("/api/v1/wallet/withdraw", json={
            "amount": 5000,
            "bank_account_id": bank["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"

    async def test_withdraw_insufficient(self, client, db):
        user, _ = await create_test_provider(db)
        user.wallet_balance = 0
        await db.commit()
        token = await get_auth_token(client, user.phone)

        bank_resp = await client.post("/api/v1/wallet/bank-accounts", json={
            "bank_name": "GTBank",
            "bank_code": "058",
            "account_number": "0123456789",
            "account_name": "Test Provider",
        }, headers=auth_headers(token))
        bank = bank_resp.json()

        resp = await client.post("/api/v1/wallet/withdraw", json={
            "amount": 5000,
            "bank_account_id": bank["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 400

    async def test_self_review_prevented(self, client, db):
        user, provider = await create_test_provider(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/reviews", json={
            "target_type": "provider",
            "target_id": provider.id,
            "rating": 5,
            "comment": "I'm great!",
        }, headers=auth_headers(token))
        assert resp.status_code == 400
        assert "yourself" in resp.json()["detail"].lower()
