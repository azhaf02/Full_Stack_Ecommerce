from sqlalchemy.orm import Session
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, type: str, message: str) -> Notification:
        """
        Reusable notification creation service for other modules:
        - Order status updates (Rukhsar)
        - Payment events (Aaliya)
        - Return updates
        """
        notification = Notification(
            user_id=user_id,
            type=type,
            message=message,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_user_notifications(db: Session, user_id: int = 1):
        """Fetch all notifications for a given user ordered by newest first."""
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int = 1):
        """Mark a single notification as read with ownership verification."""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int = 1):
        """Mark all notifications as read for a given user."""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return count
