from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/admin", tags=["Audit Logs"])


@router.get("/audit-logs")
def get_audit_logs(
    actor: int = None,
    action: str = None,
    date_from: datetime = Query(None, alias="from"),
    date_to: datetime = Query(None, alias="to"),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if actor is not None:
        query = query.filter(AuditLog.actor_id == actor)

    if action is not None:
        query = query.filter(AuditLog.action == action)

    if date_from is not None:
        query = query.filter(AuditLog.timestamp >= date_from)

    if date_to is not None:
        query = query.filter(AuditLog.timestamp <= date_to)

    logs = query.order_by(AuditLog.timestamp.desc()).all()

    return logs