# SUP1: Support & FAQ Module Documentation


## 1. Objective:
Provide users with an accessible Support & FAQ hub where they can search common questions, filter by category, and submit support tickets or inquiries.
## 2. Description:
The Support/FAQ module serves as the primary self-service and customer service gateway. It features a searchable, filterable FAQ section alongside an interactive ticket submission form with category tagging and order references.

## 3. Detailed Instructions
1. FAQ Search & Filter:
	• Implement a search bar that filters FAQs in real-time matching either the question or answer text.
	• Provide category filter options (e.g., All, Order, Payment, Return).
2. Ticket Submission Form:
	• Render input fields for Category, Order Reference ID (Optional), Subject, and Description.
	• On submission (handleSubmitTicket), trigger a success status message and reset all input fields.
3. Responsive UI:
	• Use Tailwind CSS to create clean card containers, clear form fields, and distinct focus states.

   ## 4. Expected Output
• A fully functional React component rendering a support page layout.
• Real-time client-side array filtering for FAQs based on search queries.
• Form validation ensuring required fields (Subject, Description) are completed prior to submission.

## 5. Deliverables
• Documentation File: docs/support.md detailing module requirements, UI instructions, and database specs.
• Frontend Component: frontend/src/pages/support/NewTicketPage.tsx containing the UI, state handling, and ticket submission form.

## 6. Database Requirements
• Table Name: support_tickets
• Fields / Schema:
	• id: Unique ticket identifier (Integer / Auto-increment)
	• customer_id: Shared User ID referencing users.id
	• category: Category string (Order, Payment, Return, Delivery)
	• order_id: Optional reference order ID (Integer referencing Rukhsar's orders.id)
	• subject: Ticket subject line
	• description: Detailed issue description
	• status: Ticket status (Default: 'Open')
	• created_at: Submission timestamp

## Data Dictionary Table:
Field Name	Data Type	Key/Constraint	Description
id	INTEGER	Primary Key (Auto-increment)	Unique ticket identifier
customer_id	INTEGER	Foreign Key (users.id)	ID of the submitting authenticated user
category	VARCHAR(50)	NOT NULL	Issue type (Order, Payment, Return, Delivery)
order_id	INTEGER	ForeignKey (orders.id) | NULLABLE	Optional reference order number
subject	VARCHAR(255)	NOT NULL	Brief summary of the issue
description	TEXT	NOT NULL	Detailed message from the user
status	VARCHAR(50)	DEFAULT 'Open'	Current status (Open, In Progress, Resolved)
created_at	TIMESTAMP	DEFAULT CURRENT_TIMESTAMP	Submission date and time

## SQL DDL Statement:
sql
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
Use code with caution.

## 7. Dependencies & Authentication Integration
• React Hooks: useState, useEffect
• Styling: Tailwind CSS
• Authentication Integration:
	• Import custom get_current_user hook from backend security contexts (app.core.security).
	• Enforce route integrity using require_role("customer") for ticket generation routes.
	• Automatically associate logged-in user information (current_user.id) with submitted support tickets via the database customer_id context.

## 8. Definition of Done (DoD)
• Component compiles cleanly without TypeScript or React errors.
• Real-time search and category filtering work as expected.
• Support ticket form validates inputs and displays submission feedback.
• Tailwind layout is responsive across desktop and mobile screens.
• docs/support.md is initialized with full requirements and deliverables.
• Database schema (support_tickets) is defined under models and ready for integration.

----------------------------------------------------------------

# SUP2: Admin Support & Chat Module

## 1. Objective
Provide admins with a central management panel to review incoming customer support tickets, update ticket statuses, and conduct real-time/asynchronous back-and-forth chat conversations with customers.

## 2. Description
The Admin Support & Chat module enables support agents to manage user issues efficiently. Admins can view a master queue of tickets, filter by status or category, open individual ticket threads, post direct chat replies, and update resolution statuses (Open, In Progress, Resolved, Closed).

## 3. Detailed Instructions
1. Admin Ticket Queue View:
	• Display all submitted tickets in a structured list/table.
	• Provide status filter tabs (All, Open, In Progress, Resolved).
	• Display key details: Ticket ID, Customer Email/ID, Category, Subject, Status Badge, and Submission Date.
2. Interactive Ticket Thread & Chat:
	• Selecting a ticket opens the active conversation thread.
	• Render historical chat messages distinguishing between Customer and Admin messages.
	• Provide a text area and submit button for the admin to send reply messages.
3. Status Management:
	• Provide a dropdown or action buttons to update the ticket status in real-time.
4. Responsive UI & UX:
	• Design using Tailwind CSS with a clean split-view layout (Ticket List on the left, Active Chat/Thread on the right).

   ## 4. Expected Output
• A fully functional React component (AdminSupport.tsx) rendering an admin support dashboard.
• Active ticket filtering and selection handling.
• Back-and-forth messaging interface appending new responses to the chat thread.
• Ticket status updates reflecting dynamically in the UI.

## 5. Database Requirements

Field Name	Data Type	Key / Constraint	Description
id	INTEGER	Primary Key (Auto-increment)	Unique message identifier ledger increment
ticket_id	INTEGER	Foreign Key (support_tickets.id)	ID of the parent support ticket with Cascade deletion
sender_type	VARCHAR(50)	NOT NULL	Role/Identity verification flag (Customer or Admin)
message	TEXT	NOT NULL	Chat dialogue body statement parameters
timestamp	TIMESTAMP	DEFAULT CURRENT_TIMESTAMP	Chronological message registration record tracking

## SQL DDL Statement
sql
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
Use code with caution.
## 6. Testing Instructions
1. Unit / Integration Tests:
• Verify that fetching ticket lists populates all queue items correctly.
• Verify that clicking a ticket loads its associated messages from support_messages.
• Test sending an admin reply to ensure the message appends to the thread without page reload.
• Test changing ticket status (Open -> In Progress -> Resolved) and confirm UI badge updates.
2. Role Restrictions Test:
• Verify non-admin users cannot access (AdminSupport.tsx) routes by validating user roles against security contexts.

## 7. Commit Requirements
Follow clean commit message syntax:
• #feat(support): add AdminSupport dashboard layout and ticket queue
• #feat(support): add chat thread and reply functionality
• #docs(support): update docs/support.md with SUP2 specs
• Keep commits granular and tied to specific feature increments.

## 8. Pull Request (PR) Requirements
• Target Branch: develop
• Source Branch: feature/support
• PR Title: feat(support): Implement Sprint 2 Admin Support & Chat Module
• PR Description Checklist:
	• Brief summary of changes.
	• Linked issue / task ID.
	• Screenshots / UI GIFs showing the Admin Ticket Queue and Chat Thread.
	• Confirmation that tests pass locally.

## 9. Deliverables
• Documentation File: docs/support.md (Updated with SUP1 & SUP2 specs).
• Frontend Admin Component: src/pages/AdminSupport.tsx containing the Admin Dashboard & Chat UI.
• Backend/API Endpoints: Admin ticket retrieval, message posting, and status update endpoints.

## 10. Dependencies & Role Integration
• React Hooks: useState, useEffect
• Styling: Tailwind CSS
• Authentication/Role Integration:
	• Utilize centralized backend authorization logic require_role("admin") from app.core.security to block unauthorized users.
	• Automatically evaluate string access keys (sender_type) upon executing message posting routines via backend tracking channels.

## 11. Definition of Done (DoD)
• AdminSupport.tsx compiles without TypeScript or React runtime errors.
• Admins can view, filter, and select tickets from the queue layout.
• Chat messages render correctly with distinction between Admin and Customer senders.
• Admins can post replies and update ticket statuses dynamically.
• Database schema (support_messages) is fully documented and mapped in python class models.
• All code changes are committed, pushed to feature/support, and submitted as a verified PR path.


----------------------------------------------
# 🎟️ Customer Support & Threaded Interaction Architecture Specifications

This master documentation outlines the comprehensive database layer, dynamic synchronization dependencies, testing workflows, and tracking layouts executed across Sprint Tasks **SUP-01 through SUP-06**.

---

# SUP-03: Support Ticket Creation

## 1. Objective
Allow an authenticated logged-in customer to successfully generate a support ticket row, optionally connect it to a valid order identifier reference, and record the initialization message.

## 2. Description
The Support Ticket Creation module exposes core ingestion frameworks. It hooks behind Aliza's active notification channel service utility routines to alert the customer upon record creation and performs strict order-ownership boundaries checks to eliminate invalid transactional records insertions.

## 3. Technical Core Endpoint Definition
- **POST** `/api/support/tickets` - Ingests ticket payload parameters dynamically (`subject`, `category`, `description`, `order_id`).

## 4. Business Process Validations Enforced
- **Session Identity Check:** Extracts logged-in customer parameters through secure JWT token evaluation filters.
- **Initial Lifecycle Insertion Rule:** Automatically saves incoming entries into data tables with status flags pre-assigned strictly to `'Open'`.
- **Relational Integrity Shield:** Evaluates if the incoming optional `order_id` matches rows linked directly to the user's primary metrics registry, throwing validation exceptions upon detecting anomalies.

## 5. Definition of Done (DoD) Verification
- [] Functional form page `NewTicketPage.tsx` successfully accepts all required fields parameters.
- [] Backend database validation layers intercept requests cleanly to block out invalid order bounds.
- [] First message transaction commits cleanly to the storage tables alongside the main ticket row log.
- [] Explicit cross-module callbacks execute Aliza's notification triggers flawlessly post commit operations.



-----------------------------------------------------------

# SUP-04: Customer Ticket View & Threaded Replies

## 1. Objective
Enable authenticated customers to securely track persistent lifecycle statuses, review complete chat message lineages, and safely append follow-up conversation dialogue streams onto open incident tickets.

## 2. Description
The Customer Ticket View and Thread replies module implements the relational query execution data layer interface. Authenticated users can pull comprehensive lists of support logs filtered dynamically against unique customer profiles, select active transaction entities to inspect chronological admin conversation grids, and push thread text responses constrained by explicit security limits.

## 3. Core Endpoint Specifications
- **GET** `/api/account/tickets` - Fetch all tickets created by the logged-in user scoped by unique numeric identifiers.
- **GET** `/api/account/tickets/{ticket_id}` - Fetch explicit details and historical message threads for a specific support incident row.
- **POST** `/api/account/tickets/{ticket_id}/reply` - Append an asynchronous reply message statement onto an open conversation channel thread.

## 4. Validation & Security Enforcement
- **Ownership Verification Check:** Enforces strict parameter boundary evaluation routines routing database lookups matching user identity hooks (`SupportTicket.customer_id == current_user.id`) to block cross-tenant information leaks completely (`403 Forbidden`).
- **Status Validation Constraints:** Attaches operational loop filters blocking incoming string payload structures if the state parameters match locked indices (`Closed` or `Resolved`), throwing explicit `400 Bad Request` execution exceptions.

## 5. Database Matrix Framework
- **Relational Integrity Mapping:** Performs scoped `SELECT` queries parameters filtering rows against active consumer tokens, and executes `INSERT INTO support_messages` configurations upon updating tracking logs arrays.

## 6. Definition of Done (DoD)
- [x] Backend endpoint pipelines successfully compile query values cleanly without transaction bottlenecks.
- [x] Strict data type compatibility adjusted across shared structures to resolve data matching failures.
- [x] Frontend list view component dashboard layout processes split screen thread items with **0 errors**.
- [x] Comprehensive architectural tracking logs fully documented inside `docs/support.md` mapping rules.

-----------------------------------------------------------

# SUP-05: Implement Admin Ticket Queue & Response

## 1. Objective
Provide operations managers and support helpdesk agents with a secure, centralized administrative triage dashboard workspace to effectively manage incoming customer tickets, execute status shifts, and post asynchronous thread replies.

## 2. Description
The Admin Ticket Queue & Response module exposes administrative control parameters under restricted role authorization layers. Support staff can filter historical incident arrays across explicit category or lifecycle flags, advance ticket progression variables inside a validated state-machine sequence, and record persistent message nodes that automatically coordinate backend notification alerts back to the target customer.

## 3. Detailed Instructions
1. **Administrative Queue Triage List:**
   - Implement real-time status filter layout bars (`All`, `Open`, `In-Progress`, `Resolved`, `Closed`) to organize incoming incident ledger rows efficiently.
   - Display key transaction identifiers across components: Ticket ID, Customer Session Metadata, Category Type, Subject Line, and Generation Timestamp.
2. **Interactive Reply Interface Canvas:**
   - Selecting a target ledger card opens the continuous message thread timeline, rendering chronological historical dialogue streams.
   - Attach string payload fields allowing administrators to submit structural text replies directly into the conversation stream.
3. **Strict Status Lifecycle Transitions:**
   - Integrate drop-down state management controls to update database parameters sequentially (`Open` → `In-Progress` → `Resolved` → `Closed`).
   - Automatically lock input fields and render thread protection banners if the active state variable maps to `Closed`.
4. **Cross-Module Notification Trigger:**
   - Embed transaction callback execution pathways that call Aliza's communication service logic to alert customers immediately post admin message commits.

## 4. Expected Output
- Complete isolated workspace component mapping master incoming queues smoothly into functional split views.
- Strict authorization validation check loops denying administrative route access if user roles mismatch.
- Dynamic responsive status badge updates reflecting across screen elements instantly without runtime glitches.

## 5. Deliverables
- **Documentation File Updates:** `docs/support.md` populated with explicit SUP-05 parameters.
- **Frontend Dashboard Triage Panel:** `frontend/src/pages/admin/SupportPage.tsx` outlining administrative control channels.
- **Backend Routing Endpoint File:** `backend/app/api/routes/support.py` processing admin requests.

## 6. Database Requirements & Relational Logic
- **Operations Layout Matrix:** Performs global `SELECT` fetches over data rows and executes direct `UPDATE` mutations altering `support_tickets.status` values.

### Target API Endpoints Mapping Matrix:

| HTTP Method | API Endpoint URL Routing Path | Access Scope Controls | Operational Database Activity Executed |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/support/admin/tickets` | Strict Admin Role Guard | `SELECT * FROM support_tickets;` |
| **POST** | `/api/support/admin/tickets/{ticket_id}/reply` | Strict Admin Role Guard | `INSERT INTO support_messages (sender_type='Admin');` |
| **PUT** | `/api/support/admin/tickets/{ticket_id}/status` | Strict Admin Role Guard | `UPDATE support_tickets SET status = :status WHERE id = :id;` |

## 7. Testing Instructions
### 1. Unified Access Controls Loop Check:
- Attain non-admin customer account sessions and request administrative endpoints; verify backend framework intercepts the trace to fire `403 Forbidden` access rejections.
### 2. State Mutation Bounds Verification:
- Triage active ledger rows across the interface dropdowns and verify state changes from `Open` to `Closed` register correctly inside underlying tables without text parsing breakdown.

## 8. Commit Requirements
Follow clean commit message syntax rules:
- `feat: implement admin ticket queue and response`
- `chore: wire cross-module customer alert hooks under admin reply callbacks`

## 9. Pull Request (PR) Requirements
- **Target Branch Reference:** `develop`
- **Source Branch Setup:** `feature/support`
- **PR Collaborator Tags:** Tag Rishi for admin dashboard viewport integration blocks, and tag Aliza for notification trigger sequence validations.

## 10. Dependencies & Pipeline Integration
- **Relational Lineage Chain Links:** Directly built over **SUP-04** core interaction models and integrated tightly behind Aliza's active `notification_service` modules tracking routes.

## 11. Definition of Done (DoD)
- [] Administrative query endpoints securely handle lookups protected by active privilege verification filters.
- [] Status modification script handles state value adjustments without crashing background components.
- [] Frontend workspace template builds completely into strict type-safe models with **0 compilation errors**.
- [] Comprehensive architectural tracking logs fully documented inside `docs/support.md` mapping rules.

-------------------------------------------------------------

---

# SUP-06: Integrate Return/Refund Support Context

## 1. Objective
Equip support helpdesk administrators with complete order-level return and refund statuses directly inside individual support ticket details to reduce diagnostic times and facilitate rapid case updates.

## 2. Description
The Return/Refund Support context synchronization block executes read-only database join requests combining the primary incident tickets table with internal product order tracking states. If a ticket points to a reference identifier mapping an active customer return, the backend hands over active context metrics inline, activating direct interface hyper-links into parallel administrative screens.

## 3. Core Endpoint Specifications
- **GET** `/api/support/admin/tickets/{ticket_id}` - Extends the baseline triage dictionary structure by running queries fetching relational parameters (`has_active_return`, `return_status`, `return_id`) without requiring system manual refresh sequences.

## 4. Cross-Module Data Mapping & Validations
- **Read-Only Join Enforcements:** Performs safe isolated `SELECT` queries across separate system tables without altering row entries values inside Rukhsar's tracking domains.
- **Direct Navigation Links Canvas:** Automatically wires action routing hooks passing the explicit target index token (`return_id`) directly to Rukhsar's custom workflow layout route: `/admin/returns/review/{id}`.

## 5. Definition of Done (DoD)
- [] Backend database query successfully extracts inline return status indicators via read-only join logic profiles.
- [] Front-end context layout view module renders warning banners and action redirect buttons cleanly with **0 compiler errors**.
- [] Joint team workflow dependency models perfectly aligned alongside Rukhsar's `ORD-07` tracking repositories.
