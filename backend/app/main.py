from dotenv import load_dotenv


load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles



# Load every SQLAlchemy model in app/models so relationships between modules
# (e.g. Product -> ProductVariant, Inventory -> InventoryHistory) can resolve

# Load every SQLAlchemy model so relationships resolve correctly.

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
    invoice,
)

from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router
from app.api.routes.support import router as support_router

from app.api.routes import inventory
from app.services import order_service
from app.services.inventory_service import on_order_status_change

app = FastAPI(title="Customer Dashboard & Reviews API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded product images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Notifications and reviews
app.include_router(notifications.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")

# Admin dashboard
app.include_router(admin.router)
app.include_router(category.router)


# Admin Inventory
app.include_router(inventory.router)


# Product Catalog

# Product catalogue

app.include_router(product_router)
app.include_router(public_router)

# Authentication, account and audit logs
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)

# Analytics
app.include_router(analytics.router)

# Orders, cancellation and returns
app.include_router(orders.router)


# Inventory order status integration
order_service.register_status_hook(on_order_status_change)

# Payment

# Payments

app.include_router(payment.router)

# Checkout sessions
app.include_router(checkout_sessions.router)

# Admin product management
app.include_router(catalog_router)


# Support Router Registration
app.include_router(support_router)

# PAY-06: Invoice generation and viewing
app.include_router(invoice.router)



@app.get("/")
def root():

    return {"message": "Customer Dashboard Backend API is running"}

    return {"message": "VIORA API is running"}
