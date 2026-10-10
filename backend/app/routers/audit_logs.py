from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/admin", tags=["Audit Logs"])


@router.get("/audit-logs")
def get_audit_logs(
    actor: int | None = Query(default=None),
    action: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None, alias="from"),
    date_to: datetime | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="'from' must be earlier than or equal to 'to'",
        )

    query = db.query(AuditLog)

    if actor is not None:
        query = query.filter(AuditLog.actor_id == actor)

    if action:
        query = query.filter(AuditLog.action == action)

    if date_from is not None:
        query = query.filter(AuditLog.timestamp >= date_from)

    if date_to is not None:
        query = query.filter(AuditLog.timestamp <= date_to)

    return query.order_by(AuditLog.timestamp.desc()).all()