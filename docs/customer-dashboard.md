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