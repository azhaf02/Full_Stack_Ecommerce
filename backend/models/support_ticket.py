from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship  
from .Base import Base  

class SupportTicket(Base):  
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, nullable=False)
    order_id = Column(Integer, nullable=True) 
    category = Column(String(50), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)

    
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
