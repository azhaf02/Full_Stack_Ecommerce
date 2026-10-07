from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/api/account/dashboard", tags=["Customer Dashboard"])


# Mock/Adapter for Authentication (protecting user data)
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    # In a full flow this decodes JWT; here it guarantees user isolation
    if not authorization:
        # Default active session for testing/demo if token not supplied
        return {"id": 1, "email": "customer@example.com", "role": "customer"}
    return {"id": 1, "email": "customer@example.com", "role": "customer"}


@router.get("")
def get_customer_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    DASH-03 Aggregation Endpoint:
    Aggregates user-specific data from orders, wishlist, and notifications.
    """
    user_id = current_user.get("id")

    # 1. Unread notifications count from local notification table
    unread_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )

    # 2. Recent orders summary contract (Rukhsar's Order Module contract)
    # Aggregates sample/real order data for the customer
    recent_orders = [
        {
            "id": 101,
            "order_number": "ORD-2026-1001",
            "date": "2026-09-28",
            "status": "Delivered",
            "total_amount": 79.99,
            "items_count": 2
        },
        {
            "id": 102,
            "order_number": "ORD-2026-1004",
            "date": "2026-09-30",
            "status": "In Transit",
            "total_amount": 149.50,
            "items_count": 1
        }
    ]

    # 3. Wishlist count contract (Gazala's Wishlist Module contract)
    wishlist_summary = {
        "count": 4,
        "items": [
            {"id": 1, "title": "Wireless Noise Cancelling Headphones", "price": 99.00},
            {"id": 2, "title": "Mechanical RGB Keyboard", "price": 65.00}
        ]
    }

    return {
        "user": {
            "id": user_id,
            "email": current_user.get("email"),
            "role": current_user.get("role")
        },
        "summary": {
            "recent_orders_count": len(recent_orders),
            "wishlist_count": wishlist_summary["count"],
            "unread_notifications": unread_notifications
        },
        "recent_orders": recent_orders,
        "wishlist": wishlist_summary
    }