
from dotenv import load_dotenv

load_dotenv()

import importlib
import pkgutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load every SQLAlchemy model so relationships resolve correctly.
import app.models as _models_pkg

for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")

# Product API routes.
from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router
from app.api.routes.variant import router as variant_router
from app.api.routes.support import router as support_router

# Other application routers.
from app.routers import (
    notifications,
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

# Enable CORS for the React frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded product images.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Reviews and notifications.
app.include_router(notifications.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")

# Admin and category routes.
app.include_router(admin.router)
app.include_router(category.router)

# Product catalog and product APIs.
app.include_router(product_router)
app.include_router(public_router)
app.include_router(catalog_router)

# Product variant selection.
app.include_router(variant_router)

# Wishlist.
app.include_router(wishlist_router)

# Authentication, accounts, and audit logs.
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)

# Analytics.
app.include_router(analytics.router)

# Orders and payments.
app.include_router(orders.router)
app.include_router(payment.router)

# Checkout sessions.
app.include_router(checkout_sessions.router)

# Support.
app.include_router(support_router)

# Invoice generation and viewing.
app.include_router(invoice.router)


@app.get("/")
def root():
    return {"message": "VIORA API is running"}
