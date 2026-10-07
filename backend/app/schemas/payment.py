from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class MockPaymentProcessRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_id: int
    simulate_failure: bool = False


class MockPaymentProcessResponse(BaseModel):
    payment_id: int
    transaction_id: str
    gateway_status: str
    message: str


class MockPaymentVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_id: int
    transaction_id: str


class MockPaymentVerifyResponse(BaseModel):
    payment_id: int
    transaction_id: str
    status: str
    message: str


class PaymentByOrderResponse(BaseModel):
    payment_id: int
    order_id: int
    method: PaymentMethod
    status: str
    transaction_id: str | None = None
class CODPaymentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_id: int


class CODPaymentResponse(BaseModel):
    payment_id: int
    order_id: int
    method: PaymentMethod
    status: str
    message: str