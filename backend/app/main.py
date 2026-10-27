
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load every SQLAlchemy model in app/models so relationships between modules
# (e.g. Product -> ProductVariant, Inventory -> InventoryHistory) can resolve
import importlib
import pkgutil

import app.models as _models_pkg

for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")

from app.services import order_service
from app.services.inventory_service import on_order_status_change
from app.services.cod_payment_hook import on_cod_order_change
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
    cart,
    payment,
    checkout_sessions,
    shipping_methods,
)
from app.api.routes import checkout, inventory
from app.api.routes.catalog import router as catalog_router, public_router
from app.api.routes.product import router as product_router

app = FastAPI(title="Customer Dashboard & Reviews API")

# Inventory stock deduction/restocking and COD payment hooks.
order_service.register_status_hook(on_order_status_change)
order_service.register_status_hook(on_cod_order_change)

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

# Serve uploaded product images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers with /api prefix for reviews & notifications
app.include_router(notifications.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")

# Admin Dashboard
app.include_router(admin.router)
app.include_router(category.router)

# Product Catalog
app.include_router(product_router)
app.include_router(public_router)

# Authentication / account / audit logging
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)
app.include_router(analytics.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)

# Admin product management
app.include_router(catalog_router)

# Cart
app.include_router(cart.router)

# Checkout and shipping
app.include_router(checkout.router)
app.include_router(shipping_methods.router)


app.include_router(inventory.router)

@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}
