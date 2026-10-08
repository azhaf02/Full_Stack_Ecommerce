from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_categories(db: Session, include_inactive: bool = False):
    query = db.query(Category)

    if not include_inactive:
        query = query.filter(Category.is_active.is_(True))

    return query.order_by(Category.id.desc()).all()


def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()


def create_category(db: Session, category_data: CategoryCreate):
    category = Category(
        name=category_data.name,
        description=category_data.description,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


def update_category(
    db: Session,
    category_id: int,
    category_data: CategoryUpdate,
):
    category = get_category(db, category_id)

    if not category:
        return None

    if category_data.name is not None:
        category.name = category_data.name

    if category_data.description is not None:
        category.description = category_data.description

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