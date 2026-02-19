# QuickGift API Backend

Python FastAPI backend for the QuickGift platform.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

Copy `.env` and configure:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/quickgift
SECRET_KEY=your-secret-key
PAYSTACK_SECRET_KEY=your-paystack-secret
PAYSTACK_PUBLIC_KEY=your-paystack-public
```

## Run

```bash
uvicorn app.main:app --reload
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Seed Data

```bash
python seed.py
```

## API Endpoints

### Auth
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP & get token
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with phone/password
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/me` - Update profile

### Products
- `GET /api/v1/products` - List products (filterable)
- `GET /api/v1/products/{id}` - Get product detail
- `POST /api/v1/products` - Create product (admin)
- `PATCH /api/v1/products/{id}` - Update product (admin)
- `GET /api/v1/products/categories` - List categories
- `GET /api/v1/products/occasions` - List occasions

### Providers
- `GET /api/v1/providers` - List beauty providers
- `GET /api/v1/providers/{id}` - Get provider detail + services
- `POST /api/v1/providers` - Register as provider
- `GET /api/v1/providers/{id}/services` - List services

### Orders
- `POST /api/v1/orders` - Create gift order
- `GET /api/v1/orders` - List my orders
- `GET /api/v1/orders/{id}` - Order detail

### Bookings
- `POST /api/v1/bookings` - Create beauty booking
- `GET /api/v1/bookings` - List my bookings

### Payments
- `POST /api/v1/payments/initialize` - Initialize Paystack payment
- `POST /api/v1/payments/verify/{ref}` - Verify payment
- `POST /api/v1/payments/webhook/paystack` - Paystack webhook

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/orders` - All orders
- `GET /api/v1/admin/users` - All users
- `GET /api/v1/admin/providers` - All providers
- `GET /api/v1/admin/bookings` - All bookings
