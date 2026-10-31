
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.product_image import ProductImageResponse


class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    images: list[ProductImageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    created_at: datetime
    product: WishlistProductResponse

    model_config = ConfigDict(from_attributes=True)


class WishlistResponse(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items: list[WishlistItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
