
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentSelectionRequest,
    PaymentSelectionResponse,
)

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)


@router.post(
    "/select-method",
    response_model=PaymentSelectionResponse,
)
def select_payment_method(
    data: PaymentSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Safiya's checkout API has not been merged yet.
    # Do not create payments until the session and order
    # have been securely verified.
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Payment selection is temporarily unavailable "
            "until checkout and order integration is complete."
        ),
    )
