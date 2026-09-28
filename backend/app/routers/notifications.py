from fastapi import APIRouter
from typing import List
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

# Mock storage for notifications
_mock_notifications = [
    {
        "id": 1,
        "user_id": 1,
        "title": "Order Shipped",
        "message": "Your order #1 has been shipped and is on the way!",
        "is_read": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": 2,
        "user_id": 1,
        "title": "Welcome Offer",
        "message": "Use coupon code WELCOME10 for 10% off your next purchase.",
        "is_read": False,
        "created_at": datetime.utcnow()
    }
]

@router.get("/user/{user_id}", response_model=List[NotificationResponse])
def get_user_notifications(user_id: int):
    return [n for n in _mock_notifications if n["user_id"] == user_id]

@router.put("/user/{user_id}/read-all")
def mark_all_as_read(user_id: int):
    for n in _mock_notifications:
        if n["user_id"] == user_id:
            n["is_read"] = True
    return {"message": "All notifications marked as read"}

@router.put("/{notification_id}/read")
def mark_notification_as_read(notification_id: int):
    for n in _mock_notifications:
        if n["id"] == notification_id:
            n["is_read"] = True
            return n
    return {"message": "Notification not found"}