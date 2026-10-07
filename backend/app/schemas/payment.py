from enum import Enum

from uuid import UUID
from pydantic import BaseModel


class PaymentMethod(str, Enum):
	ONLINE = "ONLINE"
	COD = "COD"


class PaymentSelectionRequest(BaseModel):
    checkout_session_id: UUID
    order_id: int
    method: PaymentMethod

class PaymentSelectionResponse(BaseModel):
	payment_id: int
	order_id: int
	method: PaymentMethod
	status: str
	message: str
