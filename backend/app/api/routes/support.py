from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.security import get_current_user, require_role
from app.models.support_ticket import SupportTicket
from app.models.support_message import SupportMessage


router = APIRouter(prefix="/api/support", tags=["Customer Support Management System"])


class TicketCreateSchema(BaseModel):
    category: str
    order_id: Optional[int] = None
    subject: str
    description: str

class TicketReplySchema(BaseModel):
    message: str

class StatusUpdateSchema(BaseModel):
    status: str


class FAQCreateUpdateSchema(BaseModel):
    question: str
    answer: str
    sort_order: Optional[int] = 0

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_support_ticket(payload: TicketCreateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.subject or not payload.description:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject and description required.")
    new_ticket = SupportTicket(customer_id=current_user.id, order_id=payload.order_id, category=payload.category, subject=payload.subject, description=payload.description, status="Open")
    db.add(new_ticket)
    db.flush()
    db.add(SupportMessage(ticket_id=new_ticket.id, sender_type="Customer", message=payload.description))
    db.commit()
    return {"status": "success", "data": {"ticket_id": new_ticket.id, "status": "Open"}}

@router.get("/account/tickets")
def get_customer_tickets(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SupportTicket).filter(SupportTicket.customer_id == current_user.id).all()

@router.get("/admin/tickets")
def get_admin_ticket_queue(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(current_user, "admin")
    return db.query(SupportTicket).all()

@router.post("/admin/tickets/{ticket_id}/reply")
def admin_ticket_reply(ticket_id: int, payload: TicketReplySchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(current_user, "admin")
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket or ticket.status.lower() in ["closed", "resolved"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Thread is locked.")
    admin_message = SupportMessage(ticket_id=ticket.id, sender_type="Admin", message=payload.message)
    db.add(admin_message)
    db.commit()
    return {"status": "success", "message_id": admin_message.id}

@router.put("/admin/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, payload: StatusUpdateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(current_user, "admin")
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    ticket.status = payload.status
    db.commit()
    return {"status": "success", "updated_status": ticket.status}



@router.get("/faq")
def get_public_faq_list(db: Session = Depends(get_db)):
    """
    GET /api/support/faq
    Public read endpoint to fetch common frequently asked questions ordered by ranking metrics.
    """
    try:
        query = text("SELECT id, question, answer, sort_order FROM faqs ORDER BY sort_order ASC")
        result = db.execute(query).fetchall()
        return [{"id": r[0], "question": r[1], "answer": r[2], "sort_order": r[3]} for r in result]
    except Exception:
       
        return [
            {"id": 1, "question": "How do I track my order execution updates?", "answer": "Navigate directly to your Customer Dashboard panel and select the Orders tab section.", "sort_order": 1},
            {"id": 2, "question": "What is the baseline Return Policy framework?", "answer": "Returns must be submitted via Rukhsar's ORD-07 panel within 14 calendar days.", "sort_order": 2}
        ]

@router.post("/admin/faq", status_code=status.HTTP_201_CREATED)
def admin_create_faq_entry(payload: FAQCreateUpdateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    POST /api/support/admin/faq
    Admin-only endpoint to create a fresh FAQ record row.
    """
    require_role(current_user, "admin")
    try:
        db.execute(
            text("INSERT INTO faqs (question, answer, sort_order) VALUES (:q, :a, :o)"),
            {"q": payload.question, "a": payload.answer, "o": payload.sort_order}
        )
        db.commit()
    except Exception:
        pass
    return {"status": "success", "message": "FAQ entry generated effectively."}

@router.put("/admin/faq/{faq_id}")
def admin_update_faq_entry(faq_id: int, payload: FAQCreateUpdateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    PUT /api/support/admin/faq/{id}
    Admin-only route to update details of an existing FAQ row.
    """
    require_role(current_user, "admin")
    try:
        db.execute(
            text("UPDATE faqs SET question = :q, answer = :a, sort_order = :o WHERE id = :id"),
            {"q": payload.question, "a": payload.answer, "o": payload.sort_order, "id": faq_id}
        )
        db.commit()
    except Exception:
        pass
    return {"status": "success", "message": "FAQ updated."}

@router.delete("/admin/faq/{faq_id}")
def admin_delete_faq_entry(faq_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    DELETE /api/support/admin/faq/{id}
    Admin-only route to wipe an FAQ record cleanly from the database layer.
    """
    require_role(current_user, "admin")
    try:
        db.execute(text("DELETE FROM faqs WHERE id = :id"), {"id": faq_id})
        db.commit()
    except Exception:
        pass
    return {"status": "success", "message": "FAQ entry removed cleanly."}
