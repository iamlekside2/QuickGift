"""
End-to-end buyer journey tests:
Register → verify → login → browse → order → pay → track → review
"""

import pytest
from tests.conftest import (
    create_test_user, create_test_product, create_test_provider,
    get_auth_token, auth_headers,
)


class TestBuyerRegistration:
    """Register → OTP → Login flow."""

    async def test_send_otp(self, client):
        resp = await client.post("/api/v1/auth/send-otp", json={"phone": "+2348012345678"})
        assert resp.status_code == 200
        assert "message" in resp.json()

    async def test_send_otp_invalid_phone(self, client):
        resp = await client.post("/api/v1/auth/send-otp", json={"phone": "123"})
        assert resp.status_code == 400

    async def test_login_with_password(self, client, db):
        user = await create_test_user(db)
        resp = await client.post("/api/v1/auth/login", json={
            "phone": user.phone,
            "password": "test123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()
        assert resp.json()["user"]["phone"] == user.phone

    async def test_login_wrong_password(self, client, db):
        await create_test_user(db)
        resp = await client.post("/api/v1/auth/login", json={
            "phone": "+2348012345678",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    async def test_login_inactive_user(self, client, db):
        from app.models.user import User
        user = await create_test_user(db)
        user.is_active = False
        await db.commit()
        resp = await client.post("/api/v1/auth/login", json={
            "phone": user.phone,
            "password": "test123",
        })
        assert resp.status_code in (401, 403)


class TestBuyerBrowsing:
    """Browse products, categories, providers."""

    async def test_list_categories(self, client, db):
        await create_test_product(db)
        resp = await client.get("/api/v1/products/categories")
        assert resp.status_code == 200
        assert len(resp.json()) > 0

    async def test_list_products(self, client, db):
        await create_test_product(db)
        resp = await client.get("/api/v1/products")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    async def test_search_products(self, client, db):
        await create_test_product(db)
        resp = await client.get("/api/v1/products?search=Test")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    async def test_get_product_detail(self, client, db):
        product = await create_test_product(db)
        resp = await client.get(f"/api/v1/products/{product.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Gift"

    async def test_list_providers(self, client, db):
        await create_test_provider(db)
        resp = await client.get("/api/v1/providers")
        assert resp.status_code == 200


class TestBuyerOrdering:
    """Place order → pay → track → cancel."""

    async def test_create_order(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 2}],
            "delivery_address": "123 Test St, Lekki",
            "delivery_city": "Lagos",
            "recipient_name": "Jane Doe",
            "recipient_phone": "+2348099887766",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["order_number"].startswith("QG-")
        assert data["status"] == "pending"
        assert data["subtotal"] == 10000  # 5000 * 2
        return data

    async def test_create_order_invalid_product(self, client, db):
        user = await create_test_user(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": "nonexistent", "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token))
        assert resp.status_code == 404

    async def test_create_order_unauthenticated(self, client, db):
        resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": "x", "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        })
        assert resp.status_code in (401, 403)

    async def test_initialize_payment(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        # Create order
        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token))
        order = order_resp.json()

        # Initialize payment
        pay_resp = await client.post("/api/v1/payments/initialize", json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": "test@test.ng",
        }, headers=auth_headers(token))
        assert pay_resp.status_code == 200
        assert "reference" in pay_resp.json()

    async def test_wallet_payment(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        # Create order
        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token))
        order = order_resp.json()

        # Pay with wallet (user has 10000 balance)
        pay_resp = await client.post("/api/v1/payments/initialize", json={
            "order_id": order["id"],
            "amount": order["total"],
            "method": "wallet",
        }, headers=auth_headers(token))
        assert pay_resp.status_code == 200
        assert pay_resp.json()["status"] == "success"

    async def test_wallet_payment_insufficient(self, client, db):
        user = await create_test_user(db)
        user.wallet_balance = 0
        await db.commit()
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token))
        order = order_resp.json()

        pay_resp = await client.post("/api/v1/payments/initialize", json={
            "order_id": order["id"],
            "amount": order["total"],
            "method": "wallet",
        }, headers=auth_headers(token))
        assert pay_resp.status_code == 400
        assert "Insufficient" in pay_resp.json()["detail"]

    async def test_list_orders(self, client, db):
        user = await create_test_user(db)
        token = await get_auth_token(client, user.phone)
        resp = await client.get("/api/v1/orders", headers=auth_headers(token))
        assert resp.status_code == 200

    async def test_cancel_order(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        # Create and pay
        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token))
        order = order_resp.json()

        # Cancel
        cancel_resp = await client.post(
            f"/api/v1/orders/{order['id']}/cancel",
            headers=auth_headers(token),
        )
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "cancelled"

    async def test_cannot_cancel_other_users_order(self, client, db):
        user1 = await create_test_user(db, phone="+2348011111111")
        user2 = await create_test_user(db, phone="+2348022222222")
        product = await create_test_product(db)
        token1 = await get_auth_token(client, user1.phone)
        token2 = await get_auth_token(client, user2.phone)

        order_resp = await client.post("/api/v1/orders", json={
            "items": [{"product_id": product.id, "quantity": 1}],
            "delivery_address": "123 Test St",
            "delivery_city": "Lagos",
        }, headers=auth_headers(token1))
        order = order_resp.json()

        # User2 tries to cancel User1's order
        cancel_resp = await client.post(
            f"/api/v1/orders/{order['id']}/cancel",
            headers=auth_headers(token2),
        )
        assert cancel_resp.status_code == 403


class TestBuyerReviews:
    """Leave review after delivery."""

    async def test_leave_review(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/reviews", json={
            "target_type": "product",
            "target_id": product.id,
            "rating": 5,
            "comment": "Amazing gift!",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["rating"] == 5

    async def test_cannot_review_twice(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        await client.post("/api/v1/reviews", json={
            "target_type": "product",
            "target_id": product.id,
            "rating": 4,
        }, headers=auth_headers(token))

        resp = await client.post("/api/v1/reviews", json={
            "target_type": "product",
            "target_id": product.id,
            "rating": 5,
        }, headers=auth_headers(token))
        assert resp.status_code == 400
        assert "already reviewed" in resp.json()["detail"].lower()

    async def test_invalid_rating(self, client, db):
        user = await create_test_user(db)
        product = await create_test_product(db)
        token = await get_auth_token(client, user.phone)

        resp = await client.post("/api/v1/reviews", json={
            "target_type": "product",
            "target_id": product.id,
            "rating": 6,
        }, headers=auth_headers(token))
        assert resp.status_code == 400
