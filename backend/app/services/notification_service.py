from datetime import datetime

class MockNotification:
    def __init__(self, id, user_id, title, message, is_read=False):
        self.id = id
        self.user_id = user_id
        self.title = title
        self.message = message
        self.is_read = is_read
        self.created_at = datetime.utcnow()

_mock_notifications = [
    MockNotification(1, 1, "Order Shipped", "Your order #1 has been shipped and is on the way!"),
    MockNotification(2, 1, "Welcome Offer", "Use coupon code WELCOME10 for 10% off your next purchase.", is_read=False),
]

class NotificationService:
    @staticmethod
    def get_user_notifications(db, user_id: int):
        return [n for n in _mock_notifications if n.user_id == user_id]

    @staticmethod
    def mark_as_read(db, notification_id: int):
        for n in _mock_notifications:
            if n.id == notification_id:
                n.is_read = True
                return n
        return None

    @staticmethod
    def mark_all_as_read(db, user_id: int):
        count = 0
        for n in _mock_notifications:
            if n.user_id == user_id and not n.is_read:
                n.is_read = True
                count += 1
        return count