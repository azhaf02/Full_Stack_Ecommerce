from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.models.notification import NotificationType
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# --- Pydantic Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCreateRequest(BaseModel):
    user_id: int
    title: str
    message: str
    type: Optional[NotificationType] = NotificationType.GENERAL

# --- Placeholder Dependency for DB Session ---
def get_db():
    raise NotImplementedError("Database session dependency to be wired with shared database engine")

# --- Routes ---
@router.get("/user/{user_id}", response_model=List[NotificationResponse])
def fetch_notifications(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Fetch all notifications for a given user."""
    return NotificationService.get_user_notifications(db=db, user_id=user_id, limit=limit)

@router.get("/user/{user_id}/unread-count")
def fetch_unread_count(user_id: int, db: Session = Depends(get_db)):
    """Get the total unread notification count for badge rendering."""
    count = NotificationService.get_unread_count(db=db, user_id=user_id)
    return {"user_id": user_id, "unread_count": count}

@router.patch("/{notification_id}/read")
def read_notification(notification_id: int, user_id: int, db: Session = Depends(get_db)):
    """Mark a specific notification as read."""
    success = NotificationService.mark_as_read(db=db, notification_id=notification_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification marked as read"}

@router.patch("/user/{user_id}/read-all")
def read_all_notifications(user_id: int, db: Session = Depends(get_db)):
    """Mark all notifications as read for a customer."""
    count = NotificationService.mark_all_as_read(db=db, user_id=user_id)
    return {"status": "success", "marked_read_count": count}

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def trigger_notification(payload: NotificationCreateRequest, db: Session = Depends(get_db)):
    """Internal trigger endpoint for other services (Orders, Wishlist) to fire notifications."""
    return NotificationService.create_notification(
        db=db,
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        notification_type=payload.type
    )