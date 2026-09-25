from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.models.review import ReviewStatus
from app.services.review_service import ReviewService

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

# --- Pydantic Schemas ---
class ReviewCreateRequest(BaseModel):
    product_id: int
    user_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    title: Optional[str] = None
    comment: str

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_id: int
    rating: int
    title: Optional[str]
    comment: str
    status: ReviewStatus
    created_at: datetime

    class Config:
        from_attributes = True

# --- Placeholder Dependency for DB Session ---
def get_db():
    raise NotImplementedError("Database session dependency to be wired with shared database engine")

# --- Routes ---
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(payload: ReviewCreateRequest, db: Session = Depends(get_db)):
    """Create a new product review."""
    return ReviewService.create_review(
        db=db,
        product_id=payload.product_id,
        user_id=payload.user_id,
        order_id=payload.order_id,
        rating=payload.rating,
        comment=payload.comment,
        title=payload.title
    )

@router.get("/product/{product_id}", response_model=List[ReviewResponse])
def fetch_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Get all approved reviews for a product."""
    return ReviewService.get_product_reviews(db=db, product_id=product_id)

@router.get("/product/{product_id}/summary")
def fetch_product_rating_summary(product_id: int, db: Session = Depends(get_db)):
    """Get aggregated star rating and count for a product."""
    return ReviewService.get_product_rating_summary(db=db, product_id=product_id)

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def fetch_user_reviews(user_id: int, db: Session = Depends(get_db)):
    """Get all reviews submitted by a customer for their dashboard."""
    return ReviewService.get_user_reviews(db=db, user_id=user_id)