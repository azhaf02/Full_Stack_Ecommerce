from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services import category_service


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"]
)


@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    return category_service.create_category(db, category)


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db)
):
    return category_service.get_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = category_service.get_category(db, category_id)

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db)
):
    updated = category_service.update_category(
        db,
        category_id,
        category
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return updated


@router.delete("/{category_id}", response_model=CategoryResponse)
def deactivate_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = category_service.deactivate_category(
        db,
        category_id
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category