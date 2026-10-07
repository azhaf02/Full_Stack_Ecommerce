from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.review import Review, ReviewModerationStatus

# Schemas
class ReviewCreate(BaseModel):
    product_id: int
    user_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = ""
    comment: str

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_id: int
    rating: int
    title: Optional[str] = ""
    comment: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

router = APIRouter(tags=["Reviews"])

# 1. Create Review (POST /api/reviews)
@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    new_review = Review(
        product_id=payload.product_id,
        user_id=payload.user_id,
        order_id=payload.order_id,
        rating=payload.rating,
        title=payload.title or "",
        comment=payload.comment,
        status=ReviewModerationStatus.APPROVED.value,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

# 2. Get User Reviews (GET /api/reviews/user/{user_id})
@router.get("/reviews/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )

# 3. Get Public Product Reviews (GET /api/products/{product_id}/reviews)
@router.get("/products/{product_id}/reviews")
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    limit: Optional[int] = Query(None, ge=1, le=50),
    page_size: Optional[int] = Query(None, ge=1, le=50),
    db: Session = Depends(get_db)
):
    actual_limit = page_size or limit or 10

    base_query = db.query(Review).filter(
        Review.product_id == product_id,
        Review.status == ReviewModerationStatus.APPROVED.value
    )
    total_count = base_query.count()

    avg_rating_result = db.query(func.avg(Review.rating)).filter(
        Review.product_id == product_id,
        Review.status == ReviewModerationStatus.APPROVED.value
    ).scalar()

    avg_rating = round(float(avg_rating_result), 1) if avg_rating_result is not None else 0.0

    offset = (page - 1) * actual_limit
    reviews = base_query.order_by(Review.created_at.desc()).offset(offset).limit(actual_limit).all()

    return {
        "product_id": product_id,
        "average_rating": avg_rating,
        "total_reviews": total_count,
        "page": page,
        "limit": actual_limit,
        "reviews": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reviews
        ]
    }