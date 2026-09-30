from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    status: Optional[Literal["ACTIVE", "INACTIVE"]] = None


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)