"""
End-to-end admin journey tests:
Login → dashboard → approve provider → suspend → view transactions → manage payouts
"""

import pytest
from tests.conftest import (
    create_test_user, create_test_admin, create_test_provider,
    create_test_product, get_auth_token, auth_headers,
)


class TestAdminLogin:
    """Admin authentication."""

    async def test_admin_login(self, client, db):
        admin = await create_test_admin(db)
        resp = await client.post("/api/v1/auth/login", json={
            "email": admin.email,
            "password": "test123",
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == "admin"

    async def test_buyer_cannot_access_admin(self, client, db):
        buyer = await create_test_user(db)
        token = await get_auth_token(client, buyer.phone)

        resp = await client.get("/api/v1/admin/dashboard", headers=auth_headers(token))
        assert resp.status_code == 403


class TestAdminDashboard:
    """Dashboard stats and analytics."""

    async def test_get_dashboard_stats(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/dashboard", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "revenue" in data
        assert "counts" in data
        assert "pending" in data

    async def test_get_settings(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/settings", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "gift_commission" in resp.json()


class TestAdminProviderManagement:
    """Approve, reject, suspend, reactivate providers."""

    async def test_list_providers(self, client, db):
        admin = await create_test_admin(db)
        await create_test_provider(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/providers", headers=auth_headers(token))
        assert resp.status_code == 200

    async def test_suspend_provider(self, client, db):
        admin = await create_test_admin(db)
        _, provider = await create_test_provider(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/suspend",
            json={"reason": "Violation of terms"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "suspended"

    async def test_reactivate_provider(self, client, db):
        admin = await create_test_admin(db)
        _, provider = await create_test_provider(db)
        token = await get_auth_token(client, admin.phone)

        # Suspend first
        await client.patch(
            f"/api/v1/providers/{provider.id}/suspend",
            json={"reason": "Test"},
            headers=auth_headers(token),
        )

        # Reactivate
        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/reactivate",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "verified"


class TestAdminOrderManagement:
    """View and manage orders."""

    async def test_list_orders(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/orders", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "items" in resp.json()

    async def test_update_order_status(self, client, db):
        admin = await create_test_admin(db)
        buyer = await create_test_user(db, phone="+2348044444444")
        product = await create_test_product(db)
        buyer_token = await get_auth_token(client, buyer.phone)
        admin_token = await get_auth_token(client, admin.phone)

        # Create order
        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(buyer_token))
        order = order_resp.json()

        # Admin confirms
        resp = await client.patch(
            f"/api/v1/orders/{order['id']}/status",
            json={"status": "confirmed"},
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200


class TestAdminTransactions:
    """View transactions and payouts."""

    async def test_list_transactions(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/transactions", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "items" in resp.json()

    async def test_list_payments(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/payments", headers=auth_headers(token))
        assert resp.status_code == 200

    async def test_list_payouts(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/payouts", headers=auth_headers(token))
        assert resp.status_code == 200

    async def test_list_users(self, client, db):
        admin = await create_test_admin(db)
        token = await get_auth_token(client, admin.phone)

        resp = await client.get("/api/v1/admin/users", headers=auth_headers(token))
        assert resp.status_code == 200
        # Password hash should NOT be in response
        if resp.json()["items"]:
            assert "password_hash" not in resp.json()["items"][0]


class TestAdminSecurity:
    """Verify admin-only access controls."""

    async def test_buyer_cannot_access_admin_orders(self, client, db):
        buyer = await create_test_user(db)
        token = await get_auth_token(client, buyer.phone)
        resp = await client.get("/api/v1/admin/orders", headers=auth_headers(token))
        assert resp.status_code == 403

    async def test_buyer_cannot_access_admin_users(self, client, db):
        buyer = await create_test_user(db)
        token = await get_auth_token(client, buyer.phone)
        resp = await client.get("/api/v1/admin/users", headers=auth_headers(token))
        assert resp.status_code == 403

    async def test_buyer_cannot_approve_provider(self, client, db):
        buyer = await create_test_user(db, phone="+2348033333333")
        _, provider = await create_test_provider(db)
        token = await get_auth_token(client, buyer.phone)

        resp = await client.patch(
            f"/api/v1/providers/{provider.id}/approve",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    async def test_unauthenticated_cannot_access_admin(self, client):
        resp = await client.get("/api/v1/admin/dashboard")
        assert resp.status_code in (401, 403)
