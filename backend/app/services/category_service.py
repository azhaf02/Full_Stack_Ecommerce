from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def create_category(db: Session, category_data: CategoryCreate):
    category = Category(
        name=category_data.name,
        description=category_data.description
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


def get_categories(db: Session):
    return db.query(Category).all()


def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()


def update_category(
    db: Session,
    category_id: int,
    category_data: CategoryUpdate
):
    category = get_category(db, category_id)

    if not category:
        return None

    update_data = category_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


def deactivate_category(db: Session, category_id: int):
    category = get_category(db, category_id)

    if not category:
        return None

    category.is_active = False

    db.commit()
    db.refresh(category)

    return category
