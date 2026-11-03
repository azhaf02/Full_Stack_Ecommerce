Full Stack Ecommerce Website
## 🎟️ Customer Support Module (Database Foundation)


### Schema Blueprint Definitions

#### 1. SupportTicket Table (`support_tickets`)
- `id`: Integer (Primary Key, Auto-Increment)
- `customer_id`: Integer (ForeignKey -> `users.id`, Cascade on Delete)
- `order_id`: Integer (Nullable reference to order workflows tracking profiles)
- `category`: String (Ticket taxonomy: Billing, Technical, etc.)
- `subject`: String (Brief statement of problem parameters)
- `description`: Text (Detailed description text field data block)
- `status`: String (Default: 'Open' tracking workflow status)
- `created_at`: DateTime (Timestamp profile matching baseline schema updates)

#### 2. SupportMessage Table (`support_messages`)
- `id`: Integer (Primary Key, Auto-Increment)
- `ticket_id`: Integer (ForeignKey -> `support_tickets.id`, Cascade on Delete)
- `sender_type`: String (Identity flag configuration: 'Customer' or 'Admin')
- `message`: Text (Raw message string parameters matching thread logs)
- `timestamp`: DateTime (Timeline synchronization checkpoint markers)

### Relationships & Migration Chain Setup
- **Threaded Communication:** Linked `SupportTicket` and `SupportMessage` layers through a strict `One-to-Many` relationship layout using SQLAlchemy mapping structures.
- **Alembic Database Versioning:** Generated baseline migration blueprint graph `0010_support.py` securely synchronized directly after the main global Order management schema sequence context (`0008_order_payment_method`).
