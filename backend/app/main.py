
from dotenv import load_dotenv

load_dotenv()

import importlib
import pkgutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load all SQLAlchemy models so relationships resolve correctly.
import app.models as _models_pkg

for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")

# Product and related API routes.
from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router
from app.api.routes.variant import router as variant_router
from app.api.routes.support import router as support_router
from app.api.routes.checkout import router as checkout_router
from app.api.routes import inventory

# Application routers.
from app.routers import (
    notifications,
    cart,
    reviews,
    admin,
    category,
    account,
    auth,
    audit_logs,
    analytics,
    orders,
    payment,
    checkout_sessions,
    shipping_methods,
    invoice,
)

# Order lifecycle hooks.
from app.services import order_service
from app.services.cod_payment_hook import on_cod_order_change
from app.services.order_notification_hook import on_order_notification
from app.services.inventory_service import on_order_status_change


app = FastAPI(title="Customer Dashboard & Reviews API")


# Enable CORS for the frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serve uploaded product images.
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# Register order status hooks.
order_service.register_status_hook(on_cod_order_change)
order_service.register_status_hook(on_order_notification)
order_service.register_status_hook(on_order_status_change)


# Customer cart.
app.include_router(cart.router)


# notifications.py already writes the full /api/... paths, so it gets no prefix (a prefix here served
# /api/api/account/notifications). reviews.py writes /reviews and /products/{id}/reviews, so it is mounted under /api.
app.include_router(notifications.router)
app.include_router(reviews.router, prefix="/api")


# Admin and category routes.
app.include_router(admin.router)
app.include_router(category.router)


# Inventory.
app.include_router(inventory.router)


# Product catalog and related APIs.
app.include_router(product_router)
app.include_router(public_router)
app.include_router(catalog_router)
app.include_router(variant_router)
app.include_router(wishlist_router)


# Checkout.
app.include_router(checkout_router)


# Authentication, accounts and audit logs.
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)


# Analytics and orders.
app.include_router(analytics.router)
app.include_router(orders.router)


# Payments and checkout sessions.
app.include_router(payment.router)
app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)


# Shipping methods.
app.include_router(shipping_methods.router)


# Support and invoices.
app.include_router(support_router)
app.include_router(invoice.router)


@app.get("/")
def root():
    return {
        "message": "VIORA API is running"
    }
