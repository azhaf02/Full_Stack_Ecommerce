from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.checkout_session import CheckoutSession
from app.models.user import User
from app.schemas.account import AddressCreate, AddressOut
from app.services import account_service

router = APIRouter(prefix="/api/checkout/sessions", tags=["Checkout Sessions"])
address_router = APIRouter(prefix="/api/checkout", tags=["Checkout Address"])

customer_only = require_role("customer")


class SessionCreate(BaseModel):
    customer_id: str


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    customer_id: str
    status: str
    created_at: datetime
    expires_at: datetime


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
):
    customer_id = payload.customer_id.strip()

    if not customer_id:
        raise HTTPException(status_code=422, detail="Customer ID is required")

    session = CheckoutSession(customer_id=customer_id)
    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    session = db.query(CheckoutSession).filter(
        CheckoutSession.session_id == str(session_id)
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Checkout session not found",
        )

    now = datetime.now(timezone.utc)
    expiry = session.expires_at

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if session.status != "active" or expiry <= now:
        raise HTTPException(
            status_code=410,
            detail="Checkout session expired or inactive",
        )

    return session


@address_router.post(
    "/address",
    response_model=AddressOut,
    status_code=201,
)
def create_checkout_address(
    data: AddressCreate,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    return account_service.create_address(db, user, data)
