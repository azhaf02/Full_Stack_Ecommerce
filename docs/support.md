# SUP1: Support & FAQ Module Documentation

## 1. Objective
Provide users with an accessible Support & FAQ hub where they can search common questions, filter by category, and submit support tickets or inquiries.

## 2. Description
The Support/FAQ module serves as the primary self-service and customer service gateway. It features a searchable, filterable FAQ section alongside an interactive ticket submission form with category tagging and order references.

## 3. Detailed Instructions
1. **FAQ Search & Filter:**
   - Implement a search bar that filters FAQs in real-time matching either the question or answer text.
   - Provide category filter options (e.g., *All, Order, Payment, Return*).
2. **Ticket Submission Form:**
   - Render input fields for **Category**, **Order Reference ID (Optional)**, **Subject**, and **Description**.
   - On submission (`handleSubmitTicket`), trigger a success status message and reset all input fields.
3. **Responsive UI:**
   - Use Tailwind CSS to create clean card containers, clear form fields, and distinct focus states.

## 4. Expected Output
- A fully functional React component (`SupportHelp.tsx`) rendering a support page layout.
- Real-time client-side array filtering for FAQs based on search queries.
- Form validation ensuring required fields (Subject, Description) are completed prior to submission.

## 5. Deliverables
- **Documentation File:** `docs/support.md` detailing module requirements, UI instructions, and database specs.
- **Frontend Component:** `src/pages/SupportHelp.tsx` containing the UI, state handling, and ticket submission form.

## 6. Database Requirements
- **Table Name:** `support_tickets`
- **Fields / Schema:**
  - `id`: Unique ticket identifier (UUID / Auto-increment)
  - `user_id`: Auth0 User ID (`sub`)
  - `user_email`: Contact email of the user
  - `category`: Category string (`Order`, `Payment`, `Return`, `Delivery`)
  - `order_id`: Optional reference order ID
  - `subject`: Ticket subject line
  - `description`: Detailed issue description
  - `status`: Ticket status (Default: `'Open'`)
  - `created_at`: Submission timestamp

Data Dictionary Table:

| Field Name | Data Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |

| id | UUID / VARCHAR(36) | Primary Key | Unique ticket identifier |
| user_id | VARCHAR(255) | Foreign Key (Auth0 sub) | ID of the submitting user |
| user_email | VARCHAR(255) | NOT NULL | Contact email address |
| category | VARCHAR(50) | NOT NULL | Issue type (Order, Payment, Return, Delivery) |
| order_id | VARCHAR(100) | NULLABLE | Optional reference order number |
| subject | VARCHAR(255) | NOT NULL | Brief summary of the issue |
| description | TEXT | NOT NULL | Detailed message from the user |
| status | VARCHAR(20) | DEFAULT 'Open' | Current status (Open, In Progress, Resolved) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission date and time |



CREATE TABLE support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    order_id VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



## 7. Dependencies & Auth0 Integration
- **React Hooks:** `useState`
- **Styling:** Tailwind CSS
- **Auth0 Integration:**
  - Import `useAuth0` hook from `@auth0/auth0-react`.
  - Capture user details (`user.email`, `user.sub`) when authenticated.
  - Automatically associate logged-in user information with submitted support tickets.

## 8. Definition of Done (DoD)
- [ ] Component compiles cleanly without TypeScript or React errors.
- [ ] Real-time search and category filtering work as expected.
- [ ] Support ticket form validates inputs and displays submission feedback.
- [ ] Tailwind layout is responsive across desktop and mobile screens.
- [ ] `docs/support.md` is updated with full requirements and deliverables.
- [ ] Database schema (`support_tickets`) is defined and ready for integration.


# SUP2: Admin Support & Chat Module

## 1. Objective
Provide admins with a central management panel to review incoming customer support tickets, update ticket statuses, and conduct real-time/asynchronous back-and-forth chat conversations with customers.


## 2. Description
The Admin Support & Chat module enables support agents to manage user issues efficiently. Admins can view a master queue of tickets, filter by status or category, open individual ticket threads, post direct chat replies, and update resolution statuses (`Open`, `In Progress`, `Resolved`, `Closed`).



## 3. Detailed Instructions
1. **Admin Ticket Queue View:**
   - Display all submitted tickets in a structured list/table.
   - Provide status filter tabs (`All`, `Open`, `In Progress`, `Resolved`).
   - Display key details: Ticket ID, Customer Email/ID, Category, Subject, Status Badge, and Submission Date.
2. **Interactive Ticket Thread & Chat:**
   - Selecting a ticket opens the active conversation thread.
   - Render historical chat messages distinguishing between Customer and Admin messages.
   - Provide a text area and submit button for the admin to send reply messages.
3. **Status Management:**
   - Provide a dropdown or action buttons to update the ticket status in real-time.
4. **Responsive UI & UX:**
   - Design using Tailwind CSS with a clean split-view layout (Ticket List on the left, Active Chat/Thread on the right).


## 4. Expected Output
- A fully functional React component (`AdminSupport.tsx`) rendering an admin support dashboard.
- Active ticket filtering and selection handling.
- Back-and-forth messaging interface appending new responses to the chat thread.
- Ticket status updates reflecting dynamically in the UI.

## 5. Database Requirements

### Data Dictionary Table (`support_messages`)
| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `VARCHAR(36)` | Primary Key | Unique message identifier |
| `ticket_id` | `VARCHAR(36)` | Foreign Key (`support_tickets.id`) | ID of the parent support ticket |
| `sender_id` | `VARCHAR(255)` | NOT NULL | Auth0 ID or identifier of sender |
| `sender_role` | `VARCHAR(20)` | NOT NULL | Role of sender (`Customer` or `Admin`) |
| `message` | `TEXT` | NOT NULL | Chat message text |
| `created_at` | `TIMESTAMP` | DEFAULT `CURRENT_TIMESTAMP` | Message timestamp |

### SQL DDL Statement
```sql
CREATE TABLE support_messages (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


6. Testing Instructions
1.Unit / Integration Tests:

-Verify that fetching ticket lists populates all queue items correctly.

-Verify that clicking a ticket loads its associated messages from support_messages.

-Test sending an admin reply to ensure the message appends to the thread without page reload.

-Test changing ticket status (Open -> In Progress -> Resolved) and confirm UI badge updates.

2.Role Restrictions Test:

Verify non-admin users cannot access (AdminSupport.tsx) routes.



7. Commit Requirements
Follow clean commit message syntax:

#feat(support): add AdminSupport dashboard layout and ticket queue

#feat(support): add chat thread and reply functionality

#docs(support): update docs/support.md with SUP2 specs

#Keep commits granular and tied to specific feature increments.


8. Pull Request (PR) Requirements

#Target Branch: develop

#Source Branch: feature/support

#PR Title: 
feat(support): Implement Sprint 2 Admin Support & Chat Module

#PR Description Checklist:

-Brief summary of changes.
-Linked issue / task ID.
-Screenshots / UI GIFs showing the Admin Ticket Queue and Chat Thread.
-Confirmation that tests pass locally.

9. Deliverables

#Documentation File: docs/support.md (Updated with SUP1 & SUP2 specs).

#Frontend Admin Component: src/pages/AdminSupport.tsx containing the Admin Dashboard & Chat UI.

#Backend/API Endpoints: Admin ticket retrieval, message posting, and status update endpoints.


10. Dependencies & Auth0 Integration

React Hooks: useState, useEffect
Styling: Tailwind CSS
Auth0 Integration:

-Utilize useAuth0 to verify admin role/permissions (user['https://your-domain/roles'].includes('Admin')).

-Pass sender_id (Auth0 user.sub) and sender_role ('Admin') when posting chat messages.

11. Definition of Done (DoD)
* [ ] AdminSupport.tsx compiles without TypeScript or React runtime errors.

* [ ] Admins can view, filter, and select tickets from the queue.

* [ ] Chat messages render correctly with distinction between Admin and Customer senders.

* [ ] Admins can post replies and update ticket statuses.

* [ ] Database schema (support_messages) is documented and ready.

* [ ] All code changes are committed, pushed to feature/support, and submitted as a PR against develop.

#########
Updated Docs:
# Support & FAQ Module Architecture Specifications (SUP-01 / SUP-02)

## 1. Core Supabase Table Structure Scheme
* **Table Name**: `support_tickets`
  * `id`: `uuid` (Primary Key, Generated Automatically)
  * `customer_id`: `uuid` (Foreign Key referencing auth.users profile table)
  * `order_id`: `int8` (Foreign Key referencing orders module table, Nullable)
  * `category`: `text` (Order, Delivery, Payment, Return, Refund)
  * `subject`: `text`
  * `description`: `text`
  * `status`: `text` (Default constraints set to 'Open')
  * `created_at`: `timestamptz` (Default to current server time)

## 2. Threaded Interaction Model Scheme
* **Table Name**: `support_messages`
  * `id`: `uuid` (Primary Key)
  * `ticket_id`: `uuid` (Foreign Key linked to support_tickets.id with Cascade deletions)
  * `sender_role`: `text` (Evaluates strings for role authorization access tracking)
  * `message_body`: `text`
  * `sent_at`: `timestamptz`

TASK DOCS:
# 🎟️ Customer Support Module - Database Foundation

This documentation outlines the database architecture designed to manage customer service tracking patterns and threaded message logs.

## 📊 Database Schema Blueprint Definitions

### 1. SupportTicket Table (`support_tickets`)
- `id`: Integer (Primary Key, Auto-Increment)
- `customer_id`: Integer (ForeignKey -> `users.id`, Cascade on Delete)
- `order_id`: Integer (Nullable reference to order workflows tracking profiles)
- `category`: String (Ticket taxonomy: Billing, Technical, Return, etc.)
- `subject`: String (Brief statement of problem parameters)
- `description`: Text (Detailed description text field data block)
- `status`: String (Default: 'Open' tracking workflow status)
- `created_at`: DateTime (Timestamp profile matching baseline schema updates)

### 2. SupportMessage Table (`support_messages`)
- `id`: Integer (Primary Key, Auto-Increment)
- `ticket_id`: Integer (ForeignKey -> `support_tickets.id`, Cascade on Delete)
- `sender_type`: String (Identity flag configuration: 'Customer' or 'Admin')
- `message`: Text (Raw message string parameters matching thread logs)
- `timestamp`: DateTime (Timeline synchronization checkpoint markers)

## 🔗 Relationships & Migration Architecture
- **Threaded Communication:** Linked `SupportTicket` and `SupportMessage` layers through a strict `One-to-Many` relationship layout using SQLAlchemy mapping structures. This enables full threaded conversation queues for support tickets.
- **Alembic Database Versioning:** Generated baseline migration blueprint graph `0010_support.py` securely synchronized directly after the main global Order management schema sequence context (`0008_order_payment_method`).
- **Cross-Module Linkage:** Properly maps `customer_id` directly against the shared Authentication user identity layout, ready for future API routing endpoints.
