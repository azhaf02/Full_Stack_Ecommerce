from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.api.routes.category import router as category_router
from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.product import router as product_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.variant import router as variant_router
from app.routers.cart import router as cart_router

from app.database.connection import engine
from app.models.base import Base

# Import models so SQLAlchemy registers them
from app.models.category import Category
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.wishlist import Wishlist, WishlistItem

# Create database tables for local development/testing
Base.metadata.create_all(bind=engine)


app = FastAPI(title="E-Commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Category routes
app.include_router(category_router)
# wishlist routes
app.include_router(wishlist_router)
# product routes

app.include_router(catalog_router)
app.include_router(product_router)
app.include_router(variant_router)
app.include_router(cart_router)

@app.get("/")
def home():
    return {"message": "E-Commerce API is running"}