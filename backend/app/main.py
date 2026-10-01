from fastapi import FastAPI

from app.api.routes.category import router as category_router
from app.api.routes.wishlist import router as wishlist_router
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


# Category routes
app.include_router(category_router)
# wishlist routes
app.include_router(wishlist_router)

@app.get("/")
def home():
    return {"message": "E-Commerce API is running"}