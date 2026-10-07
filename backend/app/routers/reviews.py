from sqlalchemy import func
from fastapi import Query

@router.get("/products/{product_id}/reviews")
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
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

    offset = (page - 1) * limit
    reviews = base_query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "product_id": product_id,
        "average_rating": avg_rating,
        "total_reviews": total_count,
        "page": page,
        "limit": limit,
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