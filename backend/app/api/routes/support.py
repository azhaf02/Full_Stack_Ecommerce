from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.core.security import get_current_user
from app.models.faq import FAQ

from app.core.security import require_role 
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


class AdminStatusUpdateSchema(BaseModel):
    status: str
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
    return {"status": "success", "ticket_id": new_ticket.id, "ticket_status": "Open"}


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
    Appends customer string dialogue inputs onto open chat streams.
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



#  RISHI ADMIN WORKSPACE ENDPOINTS
@router.get("/admin/tickets")
def admin_get_all_tickets(admin_user = Depends(require_role("admin")), db: Session = Depends(get_db)):
    """
    GET /api/support/admin/tickets
    Allows role-verified administrative panel accounts to grab full tracking logs.
    """
    return db.query(SupportTicket).all()
@router.get("/admin/tickets/{ticket_id}")
def admin_get_ticket_details(
    ticket_id: int,
    admin_user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found."
        )

    messages = db.query(SupportMessage).filter(
        SupportMessage.ticket_id == ticket_id
    ).order_by(SupportMessage.timestamp.asc()).all()

    return {
        "ticket": {
            "id": ticket.id,
            "customer_id": ticket.customer_id,
            "order_id": ticket.order_id,
            "category": ticket.category,
            "subject": ticket.subject,
            "description": ticket.description,
            "status": ticket.status,
            "created_at": ticket.created_at,
        },
        "messages": [
            {
                "id": message.id,
                "ticket_id": message.ticket_id,
                "sender_type": message.sender_type,
                "message": message.message,
                "timestamp": message.timestamp,
            }
            for message in messages
        ],
    }

@router.post("/admin/tickets/{ticket_id}/reply")
def admin_reply_to_ticket(ticket_id: int, payload: TicketReplySchema, admin_user = Depends(require_role("admin")), db: Session = Depends(get_db)):
    """
    
    POST /api/support/admin/tickets/{ticket_id}/reply
    Appends official Support Staff conversation message and appends it to customer stream view.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not located inside admin workspace grids.")
        
    new_message = SupportMessage(ticket_id=ticket.id, sender_type="Support", message=payload.message)
    db.add(new_message)
    db.commit()
    return {"status": "success", "message_id": new_message.id}


# --- ADDED: Admin Ticket Status Change Endpoint ---
@router.put("/admin/tickets/{ticket_id}/status")
def admin_change_ticket_status(ticket_id: int, payload: AdminStatusUpdateSchema, admin_user = Depends(require_role("admin")), db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target ticket thread missing.")
    ticket.status = payload.status
    db.commit()
    return {"status": "success", "updated_ticket_status": ticket.status}

# FAQ MANAGEMENT

class FAQCreateSchema(BaseModel):
    question: str
    answer: str
    sort_order: int = 0


class FAQUpdateSchema(BaseModel):
    question: str
    answer: str
    sort_order: int = 0


def format_faq(faq):
    return {
        "id": faq.id,
        "question": faq.question,
        "answer": faq.answer,
        "sort_order": faq.sort_order,
    }


@router.get("/faq")
def get_public_faqs(db: Session = Depends(get_db)):
    faqs = db.query(FAQ).order_by(
        FAQ.sort_order.asc(), FAQ.id.asc()
    ).all()

    return [format_faq(faq) for faq in faqs]


@router.get("/admin/faq")
def admin_get_faqs(
    admin_user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    faqs = db.query(FAQ).order_by(
        FAQ.sort_order.asc(), FAQ.id.asc()
    ).all()

    return [format_faq(faq) for faq in faqs]


@router.post("/admin/faq", status_code=status.HTTP_201_CREATED)
def admin_create_faq(
    payload: FAQCreateSchema,
    admin_user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    faq = FAQ(
        question=payload.question,
        answer=payload.answer,
        sort_order=payload.sort_order
    )

    db.add(faq)
    db.commit()
    db.refresh(faq)

    return format_faq(faq)


@router.put("/admin/faq/{faq_id}")
def admin_update_faq(
    faq_id: int,
    payload: FAQUpdateSchema,
    admin_user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()

    if faq is None:
        raise HTTPException(
            status_code=404,
            detail="FAQ not found"
        )

    faq.question = payload.question
    faq.answer = payload.answer
    faq.sort_order = payload.sort_order

    db.commit()
    db.refresh(faq)

    return format_faq(faq)


@router.delete("/admin/faq/{faq_id}")
def admin_delete_faq(
    faq_id: int,
    admin_user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()

    if faq is None:
        raise HTTPException(
            status_code=404,
            detail="FAQ not found"
        )

    db.delete(faq)
    db.commit()

    return {
        "status": "success",
        "message": "FAQ deleted successfully"
    }
