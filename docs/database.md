
# Database Documentation

## Project
VIORA - Full Stack E-Commerce Website

## Database
PostgreSQL (Supabase)

## ORM
SQLAlchemy

## Migration Tool
Alembic

## Database Connection
The project uses PostgreSQL hosted on Supabase. The database connection URL is stored in the root `.env` file using the `DATABASE_URL` environment variable.

**Note:** Never commit the `.env` file or expose database credentials.

## Tables

### 1. shipping_methods

This table stores the available shipping methods, their charges, estimated delivery days, and active status.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | Integer | Primary Key, Not Null | Unique shipping method ID |
| name | Varchar(100) | Unique, Not Null | Name of the shipping method |
| cost | Numeric(10,2) | Not Null | Shipping charge |
| estimated_days | Integer | Not Null | Estimated delivery days |
| status | Boolean | Not Null | Indicates whether the method is active |
| created_at | Timestamp | Not Null | Record creation date and time |

**Constraints:**
- Shipping cost must be greater than or equal to zero.
- Estimated delivery days must be greater than or equal to zero.
- Shipping method names must be unique.

**Application defaults:**
- Cost: 0
- Status: True
- Created_at: Current UTC date and time

## Shipping Methods Sample Data

The following shipping methods were inserted and verified in the database.

| Name | Cost | Estimated Days | Status |
|---|---:|---:|---|
| Standard Delivery | 50.00 | 5 | Active |
| Express Delivery | 100.00 | 2 | Active |
| Same Day Delivery | 150.00 | 0 | Active |

## Database Migrations

Alembic is used to manage database schema changes.

The shipping methods migration creates the `shipping_methods` table.

**Migration revision:** `6658707a12a7`

**Migration message:** `create shipping methods`

### Migration Commands

Check the current migration:

```powershell
.\.venv\Scripts\python.exe -m alembic current
```

View migration history:

```powershell
.\.venv\Scripts\python.exe -m alembic history
```

Create a new migration:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "migration message"
```

Apply migrations:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

## Database Verification

The following items have been verified:

- PostgreSQL connection through Alembic.
- Shipping methods migration applied successfully.
- Shipping methods table created in Supabase.
- Shipping method columns and constraints checked.
- Three sample shipping methods inserted and verified.