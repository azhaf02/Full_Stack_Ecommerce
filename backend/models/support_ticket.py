from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime

class SupportTicket:
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(50), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)
