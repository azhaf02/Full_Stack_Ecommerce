from pydantic import BaseModel, ConfigDict
from decimal import Decimal


class ShippingMethodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cost: Decimal
    estimated_days: int
    status: bool
