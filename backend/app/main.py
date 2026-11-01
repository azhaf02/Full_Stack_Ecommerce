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
from app.api.routes import inventory

# Inventory and order integration.
from app.services import order_service
from app.services.inventory_service import on_order_status_change

# Other application routers.
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
    invoice,
)

app = FastAPI(title="Customer Dashboard & Reviews API")

# Enable CORS for the React frontend running on port 5174.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded product images.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Notifications use their own /api paths.
app.include_router(cart.router)
app.include_router(notifications.router)

# Reviews.
app.include_router(reviews.router, prefix="/api")

# Admin and category routes.
app.include_router(admin.router)
app.include_router(category.router)

# Inventory.
app.include_router(inventory.router)

# Product APIs.
app.include_router(product_router)
app.include_router(public_router)
app.include_router(catalog_router)

# Product variants and Wishlist.
app.include_router(variant_router)
app.include_router(wishlist_router)

# Authentication, accounts, and audit logs.
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)

# Analytics.
app.include_router(analytics.router)

# Orders.
app.include_router(orders.router)

# Inventory order-status integration.
order_service.register_status_hook(on_order_status_change)

# Payments and checkout.
app.include_router(payment.router)
app.include_router(checkout_sessions.router)

# Support and invoices.
app.include_router(support_router)
app.include_router(invoice.router)


@app.get("/")
def root():
    return {"message": "VIORA API is running"}