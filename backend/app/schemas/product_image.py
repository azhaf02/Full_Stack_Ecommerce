from pydantic import BaseModel, ConfigDict, Field


class ProductImageCreate(BaseModel):
    product_id: int
    image_url: str = Field(min_length=1, max_length=500)
    is_primary: bool = False


class ProductImageResponse(ProductImageCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)