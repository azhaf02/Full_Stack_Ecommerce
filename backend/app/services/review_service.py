from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.review import Review, ReviewStatus

class ReviewService:
    @staticmethod
    def create_review(
        db: Session,
        product_id: int,
        user_id: int,
        order_id: int,
        rating: int,
        comment: str,
        title: Optional[str] = None
    ) -> Review:
        """Submit a product review, pending moderation."""
        review = Review(
            product_id=product_id,
            user_id=user_id,
            order_id=order_id,
            rating=rating,
            title=title,
            comment=comment,
            status=ReviewStatus.PENDING
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_product_reviews(db: Session, product_id: int, status_filter: ReviewStatus = ReviewStatus.APPROVED) -> List[Review]:
        """Fetch approved reviews for a given product."""
        return (
            db.query(Review)
            .filter(Review.product_id == product_id, Review.status == status_filter)
            .order_by(Review.created_at.desc())
            .all()
        )

    @staticmethod
    def get_user_reviews(db: Session, user_id: int) -> List[Review]:
        """Fetch all reviews submitted by a specific user."""
        return (
            db.query(Review)
            .filter(Review.user_id == user_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    @staticmethod
    def get_product_rating_summary(db: Session, product_id: int):
        """Calculate the average rating and review count for a product."""
        result = (
            db.query(
                func.avg(Review.rating).label("average_rating"),
                func.count(Review.id).label("total_reviews")
            )
            .filter(Review.product_id == product_id, Review.status == ReviewStatus.APPROVED)
            .first()
        )
        avg_rating = round(float(result.average_rating), 1) if result.average_rating else 0.0
        return {
            "product_id": product_id,
            "average_rating": avg_rating,
            "total_reviews": result.total_reviews or 0
        }