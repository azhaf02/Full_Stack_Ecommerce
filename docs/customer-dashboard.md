# Customer Dashboard, Notifications & Reviews Documentation

## 1. Overview & Architecture
The Customer Dashboard module integrates user profile management, real-time notification alerts, and product review moderation workflows.

- **Backend Stack:** FastAPI / Python, SQLAlchemy ORM, Pydantic data schemas, SQLite / PostgreSQL.
- **Frontend Stack:** React (TypeScript), Vite, React Testing Library, Vitest, JSDOM.

---

## 2. API Reference

### Product Reviews Endpoints
- `GET /api/products/{product_id}/reviews`
  - **Description:** Retrieve published reviews and review aggregates for a product.
  - **Response:**
    ```json
    {
      "product_id": 1,
      "average_rating": 4.8,
      "total_reviews": 12,
      "reviews": [
        {
          "id": 101,
          "user_name": "Aliza Khan",
          "rating": 5,
          "title": "Superb quality",
          "comment": "Exceeded all expectations, great battery life!",
          "created_at": "2026-09-28T10:15:00Z"
        }
      ]
    }
    ```

- `POST /api/products/{product_id}/reviews`
  - **Description:** Submit a customer review with rating and optional comments.
  - **Payload:**
    ```json
    {
      "rating": 5,
      "title": "Superb quality",
      "comment": "Exceeded all expectations, great battery life!"
    }
    ```
  - **Validation:** Rating must be an integer between 1 and 5; title and comment strings sanitized.

### Notifications Endpoints
- `GET /api/notifications`
  - **Description:** Fetch user notifications (order status changes, moderation updates, promotional alerts).
  - **Response:**
    ```json
    [
      {
        "id": 1,
        "type": "ORDER_SHIPPED",
        "title": "Order Shipped",
        "message": "Your order #1043 is on its way!",
        "is_read": false,
        "created_at": "2026-09-30T14:22:00Z"
      }
    ]
    ```

- `PATCH /api/notifications/{notification_id}/read`
  - **Description:** Mark an unread notification as read.

---

## 3. Frontend Component Hierarchy
- **`ReviewsList` (`frontend/src/components/ReviewsList.tsx`):**
  - Fetches product reviews asynchronously on mount.
  - Displays aggregated star ratings, review cards, submission dates, and empty-state placeholders.
- **`ReviewSubmissionModal` (`frontend/src/components/ReviewSubmissionModal.tsx`):**
  - Interactive modal dialog capturing user rating (1–5 stars), headline, and written feedback.
  - Handles client-side form validation, error states, and async dispatch to the reviews API.

---

## 4. Verification & Testing Instructions

### Backend Regression Tests
Run pytest across all reviews and notification test cases:
```bash
pytest backend/tests/test_reviews.py -v

## DASH-06: Product Review Submission

- **Endpoint**: `POST /api/reviews`
- **Validation & Gating**:
  - Gated to verified purchases with order status `DELIVERED` (coordination with ORD-05).
  - Star ratings validated strictly between 1 and 5.
  - Prevents duplicate reviews for the same order item.
- **Moderation Workflow**: Newly submitted reviews are stored with status `pending`.
- **Frontend Component**: `ReviewForm.tsx` integrated with luxury editorial theme (`#232F24`).

## DASH-08: Checkpoint 5 & 6 Integration Log

### Checkpoint 5: Dashboard & Notifications Integration (with Rukhsar)
- **Order Lifecycle Events**: Verified notification triggers on key order state updates (`DELIVERED`, `SHIPPED`).
- **Verified Purchase**: Reviews can only be submitted for completed/delivered items matching user orders.

### Checkpoint 6: Review Moderation Integration (with Rishi)
- **Review Submission**: Initial submission stores review with status `pending`.
- **Admin Moderation**: Admin endpoints allow updating status to `approved` or `rejected`.
- **Public Visibility**: Public endpoint `GET /api/products/{id}/reviews` strictly returns approved reviews only.
- **Aggregation**: Average ratings dynamically update upon review approval.

### Integration Test Results
- Integration test suite in `backend/tests/test_reviews.py` passed with 3/3 test cases covering:
  - `test_get_product_reviews` (200 OK)
  - `test_post_review_success` (201 Created)
  - `test_post_review_invalid_rating` (422 Unprocessable Entity)

  # Viora E-Commerce Customer Dashboard Module Documentation

## 1. Overview
The Customer Dashboard module centralizes customer account activities, including notification feeds, order history, wishlist management, and verified product reviews.

---

## 2. API Endpoints Reference

### Notifications
- `GET /api/notifications`: Retrieves list of user notifications with status (unread/read).
- `PATCH /api/notifications/{id}/read`: Marks a single notification as read.
- `POST /api/notifications/read-all`: Marks all notifications as read for current session.

### Wishlist & Orders (Mock & Storage)
- `GET /api/wishlist`: Returns saved wishlist items.
- `GET /api/account/orders`: Returns customer order list and status (`Delivered`, `Shipped`).

### Product Reviews
- `POST /api/reviews`: Submits a verified-purchase review (Status: `pending` or `approved`).
- `GET /api/reviews/user/{user_id}`: Retrieves all reviews authored by a specific user.
- `GET /api/products/{product_id}/reviews`: Public endpoint returning moderation-filtered approved reviews with aggregate average rating and pagination.

---

## 3. DASH-09: Final Test Case Matrix & Regression Pass

| Test ID | Module | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-DASH-01** | Notifications | User views notification inbox | Notifications load chronologically with read/unread indicators | **PASS** |
| **TC-DASH-02** | Notifications | User marks notification as read | Unread count decrements and item visually dims | **PASS** |
| **TC-DASH-03** | Orders | View order history list | Orders display with appropriate review action button | **PASS** |
| **TC-DASH-04** | Reviews | Submit review with rating between 1 and 5 | HTTP 201 Created; review persisted | **PASS** |
| **TC-DASH-05** | Reviews | Submit review with rating > 5 | HTTP 422 Unprocessable Entity (validation error) | **PASS** |
| **TC-DASH-06** | Reviews | Public reviews list query with pagination | HTTP 200 OK; only approved reviews returned with average score | **PASS** |
| **TC-DASH-07** | Reviews | Empty reviews check for product | HTTP 200 OK; returns average 0.0 and empty array | **PASS** |

---

## 4. Resolved QA Bug Fixes (Closed Bug IDs)
- **BUG-DASH-101**: Missing `/api` router prefix causing 404 on reviews endpoint — **Resolved**.
- **BUG-DASH-102**: Missing `page_size` query parameter support in public review pagination — **Resolved**.
- **BUG-DASH-103**: Pydantic schema import path collision resolved with explicit schema models — **Resolved**.
- **BUG-DASH-104**: Corrected currency symbol rendering across frontend order cards — **Resolved**.

---
*Module Status: COMPLETED & STABLE FOR DEPLOYMENT*