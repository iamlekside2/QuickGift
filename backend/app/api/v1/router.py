from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.products import router as products_router
from app.api.v1.providers import router as providers_router
from app.api.v1.orders import router as orders_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.payments import router as payments_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.chats import router as chats_router
from app.api.v1.admin import router as admin_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.upload import router as upload_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(providers_router)
api_router.include_router(orders_router)
api_router.include_router(bookings_router)
api_router.include_router(payments_router)
api_router.include_router(reviews_router)
api_router.include_router(chats_router)
api_router.include_router(admin_router)
api_router.include_router(notifications_router)
api_router.include_router(wallet_router)
api_router.include_router(upload_router)
