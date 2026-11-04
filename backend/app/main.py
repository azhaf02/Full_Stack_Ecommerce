from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load all SQLAlchemy models so cross-module relationships resolve.
import importlib
import pkgutil

import app.models as _models_pkg

for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")

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

from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router
from app.api.routes.checkout import router as checkout_router

# Order lifecycle hooks.
from app.services import order_service
from app.services.cod_payment_hook import on_cod_order_change
from app.services.order_notification_hook import on_order_notification


app = FastAPI(title="Customer Dashboard & Reviews API")


# Enable CORS for React frontend.
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


# Reviews and notifications.
app.include_router(notifications.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")


# Admin dashboard.
app.include_router(admin.router)
app.include_router(category.router)


# Product catalog.
app.include_router(product_router)
app.include_router(public_router)


# Checkout.
app.include_router(checkout_router)


# Authentication, account and audit logging.
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)


# Analytics.
app.include_router(analytics.router)


# Orders, cancellation and returns.
app.include_router(orders.router)


# Payment.
app.include_router(payment.router)


# Checkout sessions and checkout address.
app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)


# Admin product management.
app.include_router(catalog_router)


@app.get("/")
def root():
    return {
        "message": "Customer Dashboard Backend API is running"
    }