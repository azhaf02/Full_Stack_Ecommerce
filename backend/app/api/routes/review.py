from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.review import Review, ReviewModerationStatus

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class ReviewCreateRequest(BaseModel):
    user_id: int
    product_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating 1 se 5 ke beech honi chahiye")
    title: str = Field(..., min_length=2, max_length=150)
    comment: str = Field(..., min_length=5)

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_review(payload: ReviewCreateRequest, db: Session = Depends(get_db)):
    # 1. Duplicate review check for the same order item
    existing_review = db.query(Review).filter(
        Review.user_id == payload.user_id,
        Review.product_id == payload.product_id,
        Review.order_id == payload.order_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate review: Aap is order item ke liye pehle hi review submit kar chuke hain."
        )

    # 2. Verified Purchase check (Order DELIVERED hona zaroori hai - ORD-05 coordination)
    # Verification query across orders / order_items table
    order_check = db.execute(
        """
        SELECT o.status 
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        WHERE o.id = :oid AND o.user_id = :uid AND oi.product_id = :pid
        """,
        {"oid": payload.order_id, "uid": payload.user_id, "pid": payload.product_id}
    ).fetchone()

    if not order_check or str(order_check[0]).upper() != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified purchases with 'DELIVERED' status can be reviewed."
        )

    # 3. Store Review with default 'pending' moderation status
    new_review = Review(
        user_id=payload.user_id,
        product_id=payload.product_id,
        order_id=payload.order_id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
        status=ReviewModerationStatus.PENDING.value
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "message": "Review submitted successfully and is pending moderation.",
        "review_id": new_review.id,
        "status": new_review.status
    }