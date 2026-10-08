# Payment Management & Invoice System

## 1. Module Overview

**Owner:** Student 6 - Shaikh Aaliya  
**Branch:** `feature/payment`

The Payment Management & Invoice System provides the database foundation for storing payment transactions and invoices associated with customer orders.

---

## 2. Objective

The objective of this module is to:

- Store payment information for orders.
- Track payment method and payment status.
- Store transaction IDs for online payments.
- Generate and store invoice information.
- Connect payments and invoices with the Orders module.
- Maintain database integrity using foreign keys and constraints.

---

## 3. Payment Database Structure

The `payments` table contains:

| Field | Description |
|---|---|
| id | Primary key of the payment |
| order_id | References the related order |
| method | Payment method used |
| status | Current payment status |
| transaction_id | Unique transaction identifier |
| amount | Payment amount |
| created_at | Payment creation timestamp |
| updated_at | Payment update timestamp |

### Payment Methods

Supported payment methods are:

- `ONLINE`
- `COD`

These values are aligned with the Orders module.

### Payment Status Values

Supported payment statuses are:

- `PENDING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`
- `REFUND_PENDING`
- `REFUNDED`

These values are aligned with the Orders module.

---

## 4. Invoice Database Structure

The `invoices` table contains:

| Field | Description |
|---|---|
| id | Primary key of the invoice |
| order_id | References the related order |
| invoice_number | Unique invoice number |
| amount | Invoice amount |
| tax | Tax amount |
| issued_at | Invoice issue timestamp |

The `invoice_number` field has a unique constraint to prevent duplicate invoice numbers.

---

## 5. Order Integration

Both Payment and Invoice are connected to the Orders module using:

`order_id -> orders.id`

The foreign keys use `ON DELETE CASCADE`.

The Order relationship was finalized after coordination with the Orders module owner.

The Orders module uses:

- Table: `orders`
- Primary Key: `id`
- Payment Methods: `ONLINE`, `COD`
- Payment Statuses: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`

---

## 6. Payment Processing Rules

### Online Payment

An online payment can move through payment states such as:

`PENDING -> SUCCESS`

or:

`PENDING -> FAILED`

Other supported states include cancellation and refund processing.

### Cash on Delivery

For Cash on Delivery:

- Payment method is `COD`.
- Payment can remain `PENDING` until payment is collected/confirmed.

---

## 7. Database Migration

Alembic migration:

`0d01fe9783e7_create_payments_and_invoices.py`

Migration dependency:

`0008_order_payment_method -> 0d01fe9783e7`

The migration creates:

- `payments` table
- `invoices` table
- Foreign keys to `orders.id`
- Unique transaction ID constraint
- Unique invoice number constraint
- Payment and invoice indexes
- Payment method/status support

The migration was successfully applied to the shared PostgreSQL/Supabase database.

Current Alembic revision:

`0d01fe9783e7`

---

## 8. Database Verification

The database schema was verified after migration.

Verification result:

- `payments` table exists: True
- `invoices` table exists: True
- `orders` table exists: True
- Alembic revision: `0d01fe9783e7`

At verification time, the shared `orders` table contained no order records. Therefore, a Payment or Invoice sample record could not be safely inserted because both tables require a valid `orders.id` through their foreign-key relationship.

This confirms that invalid Payment or Invoice records cannot be created for nonexistent orders.

---

## 9. Files Implemented

The module includes:

- `backend/app/models/payment.py`
- `backend/app/models/invoice.py`
- `backend/alembic/versions/0d01fe9783e7_create_payments_and_invoices.py`
- `docs/payment-invoice.md`

---

## 10. Final Status

- Payment model: Completed
- Invoice model: Completed
- Order foreign-key integration: Completed
- Payment method alignment: Completed
- Payment status alignment: Completed
- Unique invoice number: Completed
- Alembic migration: Completed
- Shared Supabase migration: Completed
- Database relationship/schema verification: Completed
- Documentation: Completed