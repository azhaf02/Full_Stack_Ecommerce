from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import notifications
from app.database import engine, Base
import app.models.review
from app.api.routes import reviews

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Viora E-Commerce API", version="1.0.0")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include existing feature routers (without extra prefix)
app.include_router(notifications.router)
app.include_router(reviews.router)

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
            "price": "?7,499",
            "originalPrice": "?9,999",
            "inStock": True,
            "imageIcon": "??"
        },
        {
            "id": 2,
            "product_id": 2,
            "name": "Smart Fitness Watch v2",
            "category": "Wearables / Fitness",
            "price": "?2,499",
            "originalPrice": "?3,999",
            "inStock": True,
            "imageIcon": "?"
        },
        {
            "id": 3,
            "product_id": 3,
            "name": "Ergonomic Mechanical Keyboard",
            "category": "Peripherals / Office",
            "price": "?4,199",
            "originalPrice": "?5,499",
            "inStock": False,
            "imageIcon": "??"
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
            "image": "??",
            "date": "2026-09-21",
            "status": "Delivered",
            "total": "?7,499",
            "canReview": True
        },
        {
            "id": 9825,
            "product_id": 2,
            "product_name": "Smart Fitness Watch v2",
            "image": "?",
            "date": "2026-09-24",
            "status": "Shipped",
            "total": "?2,499",
            "canReview": False
        }
    ]
