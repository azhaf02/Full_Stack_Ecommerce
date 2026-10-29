from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    attribute_name: str
    attribute_value: str
    price_delta: Decimal
    stock: int

    model_config = ConfigDict(from_attributes=True)
