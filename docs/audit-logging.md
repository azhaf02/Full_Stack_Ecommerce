# Audit Logging

## 1. Overview

The Audit Logging Helper provides a reusable way to record important actions performed in the system.

Each audit record stores:

* Who performed the action
* What action was performed
* Which entity was affected
* The ID of the affected entity
* Additional information about the action
* The time when the action occurred

---

## 2. AuditLog Model

The AuditLog model is located at:

```text
backend/app/models/audit_log.py
```

The database table name is:

```text
audit_logs
```

### AuditLog Fields

| Field         | Type     | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `id`          | Integer  | Unique audit log ID                           |
| `actor_id`    | Integer  | ID of the user/admin who performed the action |
| `action`      | String   | Action that was performed                     |
| `entity_type` | String   | Type of entity affected                       |
| `entity_id`   | Integer  | ID of the affected entity                     |
| `details`     | Text     | Additional information about the action       |
| `timestamp`   | DateTime | Time when the audit record was created        |

---

## 3. Database Migration

The Audit Logs table migration is located at:

```text
backend/alembic/0002_create_audit_logs.py
```

The migration creates the:

```text
audit_logs
```

table with the following fields:

```text
id
actor_id
action
entity_type
entity_id
details
timestamp
```

---

## 4. Audit Logging Helper

The reusable helper is located at:

```text
backend/app/services/audit_service.py
```

The helper function is:

```python
log_action(
    db,
    actor_id,
    action,
    entity_type,
    entity_id=None,
    details=None
)
```

### Purpose

`log_action()` provides one common function that other backend modules can use to create audit records.

It:

1. Creates an `AuditLog` object.
2. Adds it to the database session.
3. Commits the record.
4. Refreshes the created object.
5. Returns the created audit record.

---

## 5. How to Use `log_action()`

Import the helper:

```python
from app.services.audit_service import log_action
```

Then call it when an action needs to be recorded.

Example:

```python
log_action(
    db=db,
    actor_id=admin_id,
    action="ROLE_CHANGED",
    entity_type="User",
    entity_id=user_id,
    details="Admin changed user role"
)
```

### Parameters

| Parameter     | Description                                |
| ------------- | ------------------------------------------ |
| `db`          | SQLAlchemy database session                |
| `actor_id`    | ID of the user/admin performing the action |
| `action`      | Name of the action                         |
| `entity_type` | Type of entity affected                    |
| `entity_id`   | ID of the affected entity                  |
| `details`     | Additional information about the action    |

`entity_id` and `details` are optional.

---

## 6. Example Actions

### User Role Change

```python
log_action(
    db=db,
    actor_id=admin_id,
    action="ROLE_CHANGED",
    entity_type="User",
    entity_id=user_id,
    details="Admin changed user role"
)
```

### Product Update

```python
log_action(
    db=db,
    actor_id=admin_id,
    action="PRODUCT_UPDATED",
    entity_type="Product",
    entity_id=product_id,
    details="Product details updated"
)
```

### Order Update

```python
log_action(
    db=db,
    actor_id=admin_id,
    action="ORDER_UPDATED",
    entity_type="Order",
    entity_id=order_id,
    details="Order status updated"
)
```

These examples show how other backend modules can reuse the helper.

---

## 7. Future Role-Change Integration

The admin role-change functionality is handled separately from the Audit Logging Helper.

Rishi will integrate the Audit Logging Helper later when the role-change backend functionality is implemented.

The role-change module can use:

```python
from app.services.audit_service import log_action
```

and record a successful role change using:

```python
log_action(
    db=db,
    actor_id=admin_id,
    action="ROLE_CHANGED",
    entity_type="User",
    entity_id=user_id,
    details="Admin changed user role"
)
```

### Responsibility

**Audit Logging task:**

* Provide the `AuditLog` model.
* Provide the `log_action()` helper.
* Provide the database migration.
* Provide documentation and usage instructions.

**Role Management task:**

* Implement the role-change functionality.
* Integrate `log_action()` later.
* Record successful role changes using the Audit Logging Helper.

The Audit Logging task does not implement the role-change functionality itself.

---

## 8. Audit Logs API

The backend provides an API for retrieving audit records.

### Endpoint

```text
GET /api/admin/audit-logs
```

The endpoint returns records from the:

```text
audit_logs
```

database table.

---

## 9. API Filters

### Filter by Actor

```text
/api/admin/audit-logs?actor=1
```

This returns audit records created by the specified actor.

### Filter by Action

```text
/api/admin/audit-logs?action=ROLE_CHANGED
```

This returns records for the specified action.

### Filter by Date Range

```text
/api/admin/audit-logs?from=2026-10-01T00:00:00&to=2026-10-01T23:59:59
```

This filters records according to their timestamp.

### Combining Filters

Filters can be combined when required.

Example:

```text
/api/admin/audit-logs?actor=1&action=ROLE_CHANGED
```

---

## 10. Testing

The Audit Logging Helper was tested against the project PostgreSQL database.

A test audit record was successfully created using:

```text
Action: AUDIT_HELPER_TEST
Entity Type: Test
Entity ID: 999
```

The helper successfully created and returned the audit record.

The Audit Logs API was also tested using:

```text
GET /api/admin/audit-logs
```

The API successfully returned the stored audit records.

---

## 11. Project Files

The Audit Logging implementation contains:

```text
backend/
├── alembic/
│   └── 0002_create_audit_logs.py
│
└── app/
    ├── models/
    │   └── audit_log.py
    │
    ├── routers/
    │   └── audit_logs.py
    │
    └── services/
        └── audit_service.py
```

Documentation:

```text
docs/
└── audit-logging.md
```

---

## 12. Current Status

### Completed

* AuditLog model created
* Audit logging helper created
* Audit Logs API created
* Audit logs database table created
* Helper tested with PostgreSQL
* API tested successfully
* Helper usage documented
* Future role-change integration documented
* Audit Logging documentation created

### Future Integration

* Rishi will integrate `log_action()` into the role-change backend functionality later.

### Remaining

* Review the changes
* Commit the Audit Logging work
* Push the feature branch
* Create the pull request

---

## 13. Definition of Done

The Audit Logging task provides:

* AuditLog schema
* Reusable `log_action()` helper
* Database migration
* Sample/test audit record
* Audit Logs API
* Helper usage documentation
* Instructions for future integration by dependent modules

The helper is ready for use by other backend modules.
