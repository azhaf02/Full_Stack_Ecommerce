from dotenv import load_dotenv

load_dotenv()

import importlib
import pkgutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import app.models as _models_pkg

# Load all SQLAlchemy models so relationships can resolve correctly.
for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")

from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router
from app.api.routes.variant import router as variant_router

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
)

app = FastAPI(title="Customer Dashboard & Reviews API")

# Enable CORS for the React frontend.
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

# Orders.
app.include_router(orders.router)

# Payments.
app.include_router(payment.router)

# Checkout sessions.
app.include_router(checkout_sessions.router)

@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}