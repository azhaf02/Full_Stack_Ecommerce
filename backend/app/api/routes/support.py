from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/support", tags=["support"])

class TicketCreateSchema(BaseModel):
    category: str
    order_id: Optional[int] = None
    subject: str
    description: str

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_support_ticket(payload: TicketCreateSchema):
    """
    SUP-03 Endpoint handler to ingest customer issue form data.
    """
    if not payload.subject or not payload.description:
        raise HTTPException(
            status_code=400, 
            detail="Subject and narrative description text content inputs are mandatory fields."
        )
    
    return {
        "status": "success",
        "message": "Ticket records processed cleanly.",
        "data": {
            "ticket_id": 999101,
            "category": payload.category,
            "order_id": payload.order_id,
            "subject": payload.subject,
            "status": "Open",
            "timestamp": datetime.utcnow().isoformat()
        }
    }
