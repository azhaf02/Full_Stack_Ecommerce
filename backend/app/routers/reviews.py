from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.review import Review, ReviewModerationStatus

router = APIRouter(prefix="/api", tags=["Reviews"])


# --- Pydantic Schemas ---
class ReviewCreate(BaseModel):
    product_id: int
    user_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: str

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_id: int
    rating: int
    title: str | None = None
    comment: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductReviewsSummaryResponse(BaseModel):
    product_id: int
    average_rating: float
    total_reviews: int
    page: int
    page_size: int
    reviews: List[ReviewResponse]


# --- Endpoints ---

# DASH-07: Get approved reviews and rating metrics for a product
@router.get("/products/{product_id}/reviews", response_model=ProductReviewsSummaryResponse)
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    base_query = db.query(Review).filter(
        Review.product_id == product_id,
        Review.status == ReviewModerationStatus.APPROVED.value,
    )

    total_reviews = base_query.count()

    # Calculate average rating
    avg_rating_result = (
        db.query(func.avg(Review.rating))
        .filter(
            Review.product_id == product_id,
            Review.status == ReviewModerationStatus.APPROVED.value,
        )
        .scalar()
    )
    average_rating = round(float(avg_rating_result), 1) if avg_rating_result else 0.0

    # Paginate reviews
    offset = (page - 1) * page_size
    reviews = (
        base_query.order_by(Review.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "product_id": product_id,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
        "page": page,
        "page_size": page_size,
        "reviews": reviews,
    }


# Submit a review
@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@router.post("/reviews/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
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

# Get reviews written by a specific user
@router.get("/reviews/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )