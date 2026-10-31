from enum import Enum
from pydantic import BaseModel

class ReviewStatusEnum(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class AdminReviewStatusUpdate(BaseModel):
    status: ReviewStatusEnum

    class Config:
        from_attributes = True