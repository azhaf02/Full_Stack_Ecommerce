from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.security import get_current_user, require_role
from app.models.support_ticket import SupportTicket
from app.models.support_message import SupportMessage

router = APIRouter(prefix="/api/support", tags=["Customer Support Thread Management"])


class TicketCreateSchema(BaseModel):
    category: str
    order_id: Optional[int] = None
    product_id: Optional[int] = None  
    subject: str
    description: str

class TicketReplySchema(BaseModel):
    message: str


@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_support_ticket(payload: TicketCreateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.subject or not payload.description:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject and description narratives required.")
    
    
    new_ticket = SupportTicket(
        customer_id=current_user.id,
        order_id=payload.order_id,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        status="Open"
    )
    
    
    if payload.product_id:
      
        new_ticket.description += f" [System Product Context Note: Linked to Item ID #{payload.product_id}]"

    db.add(new_ticket)
    db.flush()
    db.add(SupportMessage(ticket_id=new_ticket.id, sender_type="Customer", message=payload.description))
    db.commit()
    return {"status": "success", "ticket_id": new_ticket.id, "status": "Open"}


@router.get("/account/tickets")
def get_customer_tickets(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    GET /api/support/account/tickets
    Fetches user-scoped support tickets registry database rows matching active profiles.
    """
    return db.query(SupportTicket).filter(SupportTicket.customer_id == current_user.id).all()

@router.get("/account/tickets/{ticket_id}")
def get_specific_ticket_details(ticket_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    GET /api/support/account/tickets/{id}
    Enforces strict ownership validation check models before rendering full chat details logs.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket context node not located.")
    
   
    if ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: Customer profile bounds mismatch.")
        
    messages = db.query(SupportMessage).filter(SupportMessage.ticket_id == ticket_id).order_by(text("id ASC")).all()
    return {"ticket": ticket, "messages": messages}

@router.post("/account/tickets/{ticket_id}/reply")
def customer_append_thread_reply(ticket_id: int, payload: TicketReplySchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    POST /api/support/account/tickets/{id}/reply
    Appends asynchronous customer conversation string dialogue inputs onto open chat streams.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target thread missing.")
        
    if ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: Scope containment mismatch.")
        

    if ticket.status.lower() in ["closed", "resolved"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Operation Aborted: Support conversation thread is closed.")
        
    new_message = SupportMessage(ticket_id=ticket.id, sender_type="Customer", message=payload.message)
    db.add(new_message)
    db.commit()
    return {"status": "success", "message_id": new_message.id}
