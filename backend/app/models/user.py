from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    role = relationship("app.models.role.Role", back_populates="users")
    addresses = relationship("app.models.address.Address", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("app.models.notification.Notification", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("app.models.review.Review", back_populates="user", cascade="all, delete-orphan")