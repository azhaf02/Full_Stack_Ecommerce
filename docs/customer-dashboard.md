# Customer Dashboard, Notifications & Reviews Specification

## 1. Module Overview
- **Owner:** Student 8 (Aliza Khan)
- **Module:** Customer Dashboard, Notifications & Reviews
- **Git Branch:** feature/customer-dashboard

## 2. Customer Dashboard Architecture
The dashboard aggregates customer activity in a unified interface:
- **Summary Overview:** Recent orders, current active orders, wishlist item count, and unread notifications count.
- **My Orders Navigation:** Direct access to tracking details and order lifecycle history (integrated with Rukhsar's module).
- **Wishlist Integration:** Saved products and quick actions to move items to cart (integrated with Gazala's module).

## 3. Notifications System Rules
- **Triggers:** System-wide events automatically generate customer notifications:
  - Order placed / Order confirmed
  - Order shipped / Delivered
  - Payment successful / Failed
  - Return / Refund status updates
  - Support ticket responses
- **Customer Controls:** View notification list, display unread indicator badges, mark individual or all notifications as read.

## 4. Product Reviews & Ratings Rules
- **Eligibility:** Verified purchases only (order status must be DELIVERED).
- **Submission:** Star rating (1 to 5), title, text review, and optional media upload.
- **Validation:** Prevention of duplicate reviews for the same order item.
- **Moderation:** Review status flow (PENDING -> APPROVED / REJECTED) for admin moderation.
- **Display:** Approved reviews displayed on public product pages with average aggregate ratings.