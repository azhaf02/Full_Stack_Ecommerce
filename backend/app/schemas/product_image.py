from pydantic import BaseModel


class ProductImageCreate(BaseModel):
    product_id: int
    image_url: str
    is_primary: bool = False


class ProductImageResponse(ProductImageCreate):
    id: int

    class Config:
        from_attributes = True
