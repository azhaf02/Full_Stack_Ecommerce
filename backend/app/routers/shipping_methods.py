from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.shipping_method import ShippingMethodOut


router = APIRouter(
    prefix="/api/shipping-methods",
    tags=["Shipping Methods"],
)


@router.get("", response_model=list[ShippingMethodOut])
def get_shipping_methods(db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id, name, cost, estimated_days, status
            FROM shipping_methods
            WHERE status = TRUE
            ORDER BY id
        """)
    ).mappings().all()

    return rows
