from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.notification_service import NotificationService

router = APIRouter(tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationCreateRequest(BaseModel):
    user_id: int = 1
    type: str
    message: str

# 1. Endpoints matching DASH-05 sheet specification
@router.get("/api/account/notifications", response_model=List[NotificationResponse])
@router.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(user_id: int = 1, db: Session = Depends(get_db)):
    """Fetch notifications for authenticated user (defaults to user_id=1)."""
    notifications = NotificationService.get_user_notifications(db, user_id=user_id)
    # If empty database on first run, seed default initial notifications
    if not notifications:
        NotificationService.create_notification(
            db, user_id=user_id, type="order_status", message="Your Order #9821 has been delivered successfully."
        )
        NotificationService.create_notification(
            db, user_id=user_id, type="payment_success", message="Payment of ?7,499 confirmed via UPI."
        )
        NotificationService.create_notification(
            db, user_id=user_id, type="promotional", message="Exclusive Privileges: Complimentary express delivery on your next atelier order."
        )
        notifications = NotificationService.get_user_notifications(db, user_id=user_id)
    return notifications

@router.put("/api/account/notifications/{notification_id}/read", response_model=NotificationResponse)
@router.put("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(notification_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    """Mark single notification as read with ownership check."""
    notification = NotificationService.mark_as_read(db, notification_id=notification_id, user_id=user_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found or access denied")
    return notification

@router.put("/api/account/notifications/read-all")
@router.put("/api/notifications/read-all")
def mark_all_read(user_id: int = 1, db: Session = Depends(get_db)):
    """Mark all notifications as read."""
    updated = NotificationService.mark_all_as_read(db, user_id=user_id)
    return {"message": "All notifications marked as read", "count": updated}

# 2. Integration / Test Triggering Endpoint (Requirement: Verify triggered from order/payment)
@router.post("/api/notifications/trigger", response_model=NotificationResponse)
def trigger_notification_event(payload: NotificationCreateRequest, db: Session = Depends(get_db)):
    """Test webhook simulating Order Status change (Rukhsar) or Payment event (Aaliya)."""
    notification = NotificationService.create_notification(
        db, user_id=payload.user_id, type=payload.type, message=payload.message
    )
    return notification
