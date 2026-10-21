from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------- responses

class OrderItemOut(_Out):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: Decimal


class StatusHistoryOut(_Out):
    previous_status: Optional[str] = None
    new_status: str
    changed_by: Optional[int] = None
    remarks: Optional[str] = None
    changed_at: datetime


class ReturnItemOut(_Out):
    order_item_id: int
    quantity: int


class ReturnOut(_Out):
    id: int
    order_id: int
    reason: str
    status: str
    admin_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    refund_amount: Optional[Decimal] = None
    requested_at: datetime
    items: List[ReturnItemOut] = []


class OrderSummaryOut(_Out):
    id: int
    order_number: str
    status: str
    payment_method: str
    payment_status: str
    total_amount: Decimal
    created_at: datetime


class OrderActions(BaseModel):
    """What the customer can do next, so the page can show or hide buttons without repeating the rules."""
    can_cancel: bool
    can_request_return: bool
    return_deadline: Optional[datetime] = None
    # Admin responses only: the statuses PUT /api/admin/orders/{id}/status will accept right now.
    allowed_next_statuses: Optional[List[str]] = None


class OrderDetailOut(OrderSummaryOut):
    address_id: int
    shipping_method_id: int
    coupon_id: Optional[int] = None
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    shipping_cost: Decimal
    updated_at: datetime
    items: List[OrderItemOut]
    status_history: List[StatusHistoryOut]
    returns: List[ReturnOut]
    actions: Optional[OrderActions] = None  # filled in by the route


class CustomerBrief(_Out):
    id: int
    name: str
    email: str


class AddressBrief(_Out):
    id: int
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str


class AdminOrderDetailOut(OrderDetailOut):
    """What the admin order page needs in one call. customer/address are null if that row no longer exists."""
    user_id: int
    customer: Optional[CustomerBrief] = None
    address: Optional[AddressBrief] = None


# ---------------------------------------------------------------- requests

class OrderLineIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    """What a customer sends to place an order. There is deliberately no price, total or shipping cost:
    extra fields are rejected so nobody can try to supply one.

    Two ways to say what is being bought:
      * `checkout_reference_id` - the id returned by POST /api/checkout/session. The order is built from that
        server-side snapshot (address, shipping, items, discount). address_id / shipping_method_id are
        optional here and must match the snapshot if sent.
      * `items` (+ address_id, shipping_method_id) - a direct order, e.g. "buy now".
    """
    model_config = ConfigDict(extra="forbid")
    payment_method: Literal["ONLINE", "COD"]
    checkout_reference_id: Optional[str] = Field(default=None, min_length=1, max_length=64)
    address_id: Optional[int] = None
    shipping_method_id: Optional[int] = None
    items: Optional[List[OrderLineIn]] = Field(default=None, min_length=1, max_length=50)

    @model_validator(mode="after")
    def _one_source(self):
        if (self.checkout_reference_id is None) == (self.items is None):
            raise ValueError("Send either checkout_reference_id or items, not both and not neither")
        if self.items is not None and (self.address_id is None or self.shipping_method_id is None):
            raise ValueError("address_id and shipping_method_id are required when sending items")
        return self


class CancelRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class ReturnItemIn(BaseModel):
    order_item_id: int
    quantity: int = Field(gt=0)


class ReturnRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)
    items: List[ReturnItemIn] = Field(min_length=1)


class StatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = Field(default=None, max_length=500)


class ReturnReview(BaseModel):
    action: Literal["approve", "reject", "mark_returned", "complete_refund"]
    remarks: Optional[str] = Field(default=None, max_length=500)
