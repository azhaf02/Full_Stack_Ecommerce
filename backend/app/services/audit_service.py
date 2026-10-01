from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: int = None,
    details: str = None
):
    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log