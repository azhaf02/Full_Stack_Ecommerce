from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class ProductBase(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    status: str = "ACTIVE"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    status: Optional[str] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
