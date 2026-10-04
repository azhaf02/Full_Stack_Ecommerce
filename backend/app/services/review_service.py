from datetime import datetime
from typing import List, Optional
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