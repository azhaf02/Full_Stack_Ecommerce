from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductVariantCreate(BaseModel):
    product_id: int
    attribute_name: str
    attribute_value: str
    price_delta: Decimal = Decimal("0.00")
    stock: int = 0


class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    attribute_name: str
    attribute_value: str
    price_delta: Decimal
    stock: int

    model_config = ConfigDict(from_attributes=True)