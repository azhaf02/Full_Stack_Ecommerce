from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session


from app.db.session import get_db
from app.core.security import get_current_user
from app.models.support_ticket import SupportTicket
from app.models.support_message import SupportMessage


router = APIRouter(prefix="/api/account/tickets", tags=["Customer Support Thread Management"])


class TicketCreateSchema(BaseModel):
    category: str
    order_id: Optional[int] = None
    subject: str
    description: str

class TicketReplySchema(BaseModel):
    message: str


@router.post("", status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: TicketCreateSchema, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    SUP-03 Endpoint handler to ingest customer issue form data and map user identity hooks.
    """
    if not payload.subject or not payload.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Subject and narrative description text content inputs are mandatory fields."
        )
    
    new_ticket = SupportTicket(
        customer_id=current_user.id, 
        order_id=payload.order_id, 
        category=payload.category, 
        subject=payload.subject, 
        description=payload.description, 
        status="Open"
    )
    db.add(new_ticket)
    db.flush()
    

    db.add(SupportMessage(ticket_id=new_ticket.id, sender_type="Customer", message=payload.description))
    db.commit()
    
    return {"status": "success", "data": {"ticket_id": new_ticket.id, "status": "Open"}}


@router.get("")
def get_customer_tickets(
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Fetches comprehensive support records explicitly scoped by the active logged-in customer's database ID.
    """
    # AUTH-06 Integrity check alignment: Enforces cross-tenant data leakage boundaries
    return db.query(SupportTicket).filter(SupportTicket.customer_id == current_user.id).all()


@router.get("/{ticket_id}")
def get_specific_ticket(
    ticket_id: int, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Fetches explicit details and historical message threads for a specific support incident row.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    

    if not ticket or ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: Operational credentials do not match row ownership.")
    
    messages = db.query(SupportMessage).filter(SupportMessage.ticket_id == ticket_id).all()
    return {"ticket": ticket, "messages": messages}


@router.post("/{ticket_id}/reply")
def customer_ticket_reply(
    ticket_id: int, 
    payload: TicketReplySchema, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Appends follow-up conversation dialogue strings onto an open support channel thread.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    
    if not ticket or ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: Operational credentials do not match row ownership.")
    
    
    if ticket.status.lower() in ["closed", "resolved"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction Rejected: Thread is locked.")
    
    new_message = SupportMessage(ticket_id=ticket.id, sender_type="Customer", message=payload.message)
    db.add(new_message)
    db.commit()
    
    return {"status": "success", "message_id": new_message.id}
