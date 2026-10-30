from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import require_role
from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import (
    create_category,
    deactivate_category,
    get_categories,
    get_category,
    update_category,
)

router = APIRouter(
    prefix="/api/admin/categories",
    tags=["Admin Categories"],
    dependencies=[Depends(require_role("admin"))],
)


@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    return get_categories(db, include_inactive)


@router.get("/{category_id}", response_model=CategoryResponse)
def read_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = get_category(db, category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(__import__("app.models.category", fromlist=["Category"]).Category)
        .filter(
            __import__("app.models.category", fromlist=["Category"]).Category.name
            == category_data.name
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )

    return create_category(db, category_data)


@router.put("/{category_id}", response_model=CategoryResponse)
def edit_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
):
    category = update_category(db, category_id, category_data)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category


@router.delete("/{category_id}", response_model=CategoryResponse)
def deactivate(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = deactivate_category(db, category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category