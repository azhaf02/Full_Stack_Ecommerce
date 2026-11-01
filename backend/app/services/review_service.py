from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.review import ReviewStatus

class MockReview:
    """Mock Review object simulating the Review model."""
    def __init__(self, id: int, product_id: int, user_id: int, order_id: int, rating: int, comment: str, title: Optional[str] = None):
        self.id = id
        self.product_id = product_id
        self.user_id = user_id
        self.order_id = order_id
        self.rating = rating
        self.title = title or ""
        self.comment = comment
        self.status = ReviewStatus.PENDING
        self.created_at = datetime.utcnow()

# In-memory storage to prevent 404 errors during review submissions
_reviews_db: List[MockReview] = []

class ReviewService:
    @staticmethod
    def create_review(
        db,
        product_id: int,
        user_id: int,
        order_id: int,
        rating: int,
        comment: str,
        title: Optional[str] = None
    ):
        """Submit a product review, pending moderation."""
        new_id = len(_reviews_db) + 1
        review = MockReview(
            id=new_id,
            product_id=product_id,
            user_id=user_id,
            order_id=order_id,
            rating=rating,
            title=title,
            comment=comment
        )
        _reviews_db.append(review)
        return review

    @staticmethod
    def get_product_reviews(db, product_id: int, status_filter: ReviewStatus = ReviewStatus.APPROVED):
        """Fetch approved reviews for a given product."""
        return [r for r in _reviews_db if r.product_id == product_id]

    @staticmethod
    def get_user_reviews(db, user_id: int):
        """Fetch all reviews submitted by a specific user."""
        return [r for r in _reviews_db if r.user_id == user_id]

    @staticmethod
    def get_product_rating_summary(db, product_id: int):
        """Calculate the average rating and review count for a product."""
        product_reviews = [r for r in _reviews_db if r.product_id == product_id]
        if not product_reviews:
            return {"product_id": product_id, "average_rating": 0.0, "total_reviews": 0}
        
        avg = sum(r.rating for r in product_reviews) / len(product_reviews)
        return {
            "product_id": product_id,
            "average_rating": round(avg, 1),
            "total_reviews": len(product_reviews)
        }

    # ================= ADMIN REVIEW METHODS =================

    @staticmethod
    def get_all_reviews_admin(db, status_filter: Optional[str] = None) -> List[MockReview]:
        """Fetch all reviews for admin panel with optional status filter."""
        if not status_filter:
            return _reviews_db
        return [
            r for r in _reviews_db 
            if str(r.status).lower() == status_filter.lower() or (hasattr(r.status, "value") and r.status.value.lower() == status_filter.lower())
        ]

    @staticmethod
    def update_review_status_admin(db, review_id: int, new_status: str) -> MockReview:
        """Update review status (Approved/Hidden/Pending) by admin."""
        review = next((r for r in _reviews_db if r.id == review_id), None)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review with id {review_id} not found"
            )
        
        # Match case-insensitively with ReviewStatus enum
        matched_status = None
        for s in ReviewStatus:
            if s.value.lower() == new_status.lower() or s.name.lower() == new_status.lower():
                matched_status = s
                break
        
        review.status = matched_status if matched_status is not None else new_status
        return review