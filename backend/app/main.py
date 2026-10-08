from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

from app.api.routes.catalog import (
    router as catalog_router,
    public_router,
    search_router,
)
from app.api.routes.product import router as product_router

from app.database import engine, Base

import app.models.review
import app.models.base
import app.models.category
import app.models.product
import app.models.product_image
import app.models.product_variant
import app.models.user
import app.models.role
import app.models.address
import app.models.notification
import app.models.audit_log
import app.models.order
import app.models.payment
import app.models.checkout_session
import app.models.inventory
import app.models.inventory_history
import app.models.invoice


# Ensure database tables exist
Base.metadata.create_all(bind=engine)


app = FastAPI(title="Viora E-Commerce API", version="1.0.0")


# Enable CORS for React frontend
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


# Register routers
app.include_router(notifications.router)
app.include_router(reviews.router)

# Admin Dashboard
app.include_router(admin.router)
app.include_router(category.router)

app.include_router(search_router)
app.include_router(product_router)

app.include_router(public_router)

# Authentication / account / audit logging
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)

# Analytics
app.include_router(analytics.router)

# Orders, cancellation and returns
app.include_router(orders.router)

# Payment
app.include_router(payment.router)

# Checkout sessions
app.include_router(checkout_sessions.router)

# Admin product management
app.include_router(catalog_router)
app.include_router(search_router)


@app.get("/")
def read_root():
    return {"status": "online", "message": "Viora Backend API Running"}


# Endpoint for Wishlist (DASH-04)
@app.get("/api/wishlist")
def get_wishlist():
    return [
        {
            "id": 1,
            "product_id": 1,
            "name": "Bluetooth Noise-Cancelling Headphones",
            "category": "Electronics / Audio",
            "price": "₹7,499",
            "originalPrice": "₹9,999",
            "inStock": True,
            "imageIcon": "🎧"
        },
        {
            "id": 2,
            "product_id": 2,
            "name": "Smart Fitness Watch v2",
            "category": "Wearables / Fitness",
            "price": "₹2,499",
            "originalPrice": "₹3,999",
            "inStock": True,
            "imageIcon": "⌚"
        },
        {
            "id": 3,
            "product_id": 3,
            "name": "Ergonomic Mechanical Keyboard",
            "category": "Peripherals / Office",
            "price": "₹4,199",
            "originalPrice": "₹5,499",
            "inStock": False,
            "imageIcon": "⌨️"
        }
    ]


# Endpoint for Orders (DASH-04)
@app.get("/api/account/orders")
def get_orders():
    return [
        {
            "id": 9821,
            "product_id": 1,
            "product_name": "Bluetooth Noise-Cancelling Headphones",
            "image": "🎧",
            "date": "2026-09-21",
            "status": "Delivered",
            "total": "₹7,499",
            "canReview": True
        },
        {
            "id": 9825,
            "product_id": 2,
            "product_name": "Smart Fitness Watch v2",
            "image": "⌚",
            "date": "2026-09-24",
            "status": "Shipped",
            "total": "₹2,499",
            "canReview": False
        }
    ]