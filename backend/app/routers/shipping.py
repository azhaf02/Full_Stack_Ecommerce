from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(
    prefix="/api/shipping-methods",
    tags=["Shipping Methods"]
)


@router.get("")
def get_shipping_methods(db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id, name, cost, status
            FROM shipping_methods
            WHERE status = true
            ORDER BY cost ASC
        """)
    ).mappings().all()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "cost": row["cost"],
            "status": row["status"],
        }
        for row in rows
    ]
