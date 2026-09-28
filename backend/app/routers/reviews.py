from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

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
    title: Optional[str] = None
    comment: str
    status: str
    created_at: datetime

_mock_reviews = []

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate):
    new_review = {
        "id": len(_mock_reviews) + 1,
        "product_id": payload.product_id,
        "user_id": payload.user_id,
        "order_id": payload.order_id,
        "rating": payload.rating,
        "title": payload.title or "",
        "comment": payload.comment,
        "status": "APPROVED",
        "created_at": datetime.utcnow()
    }
    _mock_reviews.append(new_review)
    return new_review

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(user_id: int):
    return [r for r in _mock_reviews if r["user_id"] == user_id]