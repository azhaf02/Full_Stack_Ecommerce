from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishlistResponse(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items: list[WishlistItemResponse] = []

    model_config = ConfigDict(from_attributes=True)