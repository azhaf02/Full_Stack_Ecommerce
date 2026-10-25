from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.services.inventory_service import get_stock_status


router = APIRouter(
    prefix="/api/admin/inventory",
    tags=["Admin Inventory"],
    dependencies=[Depends(require_role("admin"))],
)


class InventoryAdjustmentRequest(BaseModel):
    quantity_change: int
    reason: str = Field(..., min_length=1, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Reason is required.")

        return value


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    variant_id: int | None
    quantity: int
    low_stock_threshold: int
    status: str
    location: str | None

    class Config:
        from_attributes = True


def _inventory_response(
    inventory: Inventory,
    product_name: str,
) -> InventoryResponse:
    stock_status = get_stock_status(
        inventory.quantity,
        inventory.low_stock_threshold,
    )

    status_map = {
        "in_stock": "IN_STOCK",
        "low_stock": "LOW_STOCK",
        "out_of_stock": "OUT_OF_STOCK",
    }

    return InventoryResponse(
        id=inventory.id,
        product_id=inventory.product_id,
        product_name=product_name,
        variant_id=inventory.variant_id,
        quantity=inventory.quantity,
        low_stock_threshold=inventory.low_stock_threshold,
        status=status_map[stock_status],
        location=inventory.location,
    )


@router.get("", response_model=list[InventoryResponse])
def get_inventory(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Inventory, Product.name)
        .outerjoin(Product, Product.id == Inventory.product_id)
        .order_by(Inventory.id.asc())
        .all()
    )

    return [
        _inventory_response(inventory, product_name or f"Product {inventory.product_id}")
        for inventory, product_name in rows
    ]


@router.put("/{inventory_id}", response_model=InventoryResponse)
def admin_adjust_inventory(
    inventory_id: int,
    data: InventoryAdjustmentRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id
    ).first()

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found.",
        )

    previous_quantity = inventory.quantity
    new_quantity = previous_quantity + data.quantity_change

    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Inventory quantity cannot become negative. "
                f"Current quantity: {previous_quantity}, "
                f"requested change: {data.quantity_change}."
            ),
        )

    inventory.quantity = new_quantity

    stock_status = get_stock_status(
        new_quantity,
        inventory.low_stock_threshold,
    )

    status_map = {
        "in_stock": "IN_STOCK",
        "low_stock": "LOW_STOCK",
        "out_of_stock": "OUT_OF_STOCK",
    }

    inventory.status = status_map[stock_status]

    from app.models.inventory_history import InventoryHistory

    history = InventoryHistory(
        inventory_id=inventory.id,
        product_id=inventory.product_id,
        change_amount=data.quantity_change,
        changed_by=current_admin.id,
        change_type="ADMIN_ADJUSTMENT",
        quantity_changed=abs(data.quantity_change),
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reason=data.reason,
        location=inventory.location,
    )

    db.add(history)
    db.commit()
    db.refresh(inventory)

    product = db.query(Product).filter(
        Product.id == inventory.product_id
    ).first()

    return _inventory_response(
        inventory,
        product.name if product else f"Product {inventory.product_id}",
    )


@router.get("/low-stock", response_model=list[InventoryResponse])
def get_low_stock_inventory(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Inventory, Product.name)
        .outerjoin(Product, Product.id == Inventory.product_id)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .order_by(Inventory.quantity.asc())
        .all()
    )

    return [
        _inventory_response(inventory, product_name or f"Product {inventory.product_id}")
        for inventory, product_name in rows
    ]