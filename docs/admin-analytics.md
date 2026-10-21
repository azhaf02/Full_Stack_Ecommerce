# Admin Analytics

## 1. Module Overview

- **Module:** Admin Analytics
- **Tasks:** ANA-03 — Implement Admin Analytics – Core KPIs
- **Analytics Charts:** Sales, Orders, Products, Categories, Revenue, and Order Status
- **Frontend:** `frontend/src/pages/admin/AnalyticsPage.tsx`
- **Backend:** `backend/app/routers/analytics.py`
- **KPI API:** `GET /api/admin/analytics/summary`
- **Charts API:** `GET /api/admin/analytics/charts`

The Admin Analytics module provides administrators with a centralized view of important business KPIs and analytics charts.

The Analytics page uses real data from the existing PostgreSQL database. No analytics values are hard-coded in the frontend.

---

## 2. Purpose

The purpose of the Admin Analytics module is to help administrators monitor:

- Order activity
- Revenue
- Customers
- Products
- Pending orders
- Completed orders
- Cancelled orders
- Pending payments
- Low-stock inventory
- Sales trends
- Order trends
- Top-selling products
- Top-selling categories
- Revenue by category
- Order status distribution

The module reuses the existing project database, authentication, order, payment, product, category, and inventory logic.

No separate analytics database is required.

---

# 3. Core KPIs

The Analytics summary API provides the following KPI values:

| KPI | Description |
|---|---|
| Total Orders | Total number of orders |
| Total Revenue | Sum of order total amounts |
| Total Customers | Number of users with the customer role |
| Total Products | Total number of products |
| Pending Orders | Orders currently in active processing stages |
| Completed Orders | Orders with `DELIVERED` status |
| Cancelled Orders | Orders with `CANCELLED` status |
| Pending Payments | Payments with `PENDING` status |
| Low Stock Products | Inventory records where quantity is less than or equal to the low-stock threshold |

---

# 4. KPI API

## GET `/api/admin/analytics/summary`

The endpoint is protected by admin authentication.

A valid admin JWT token must be provided:

```text
Authorization: Bearer <admin_token>

The endpoint returns the analytics summary as JSON.

Example response:

{
  "total_orders": 3,
  "total_sales": 600,
  "total_customers": 3,
  "total_products": 5,
  "pending_orders": 1,
  "completed_orders": 1,
  "cancelled_orders": 1,
  "pending_payments": 1,
  "low_stock_count": 3
}

The exact values depend on the current state of the PostgreSQL database.

5. KPI Data Sources
KPI	Database Source
Total Orders	orders
Total Revenue	orders.total_amount
Total Customers	users + roles
Total Products	products
Pending Orders	orders.status
Completed Orders	orders.status
Cancelled Orders	orders.status
Pending Payments	payments.status
Low Stock Products	inventory

The existing project database and business logic are reused.

No separate analytics database was created.

6. KPI Calculation
Total Orders

Counts all records in the orders table.

COUNT(orders.id)
Total Revenue

Calculates the sum of order total amounts.

SUM(orders.total_amount)

The value is returned as a numeric value and displayed as currency in the frontend.

Total Customers

Counts users whose role is customer.

The calculation joins the users and roles tables and filters:

role.name = "customer"
Total Products

Counts records in the existing products table.

Pending Orders

Counts orders in the active processing stages:

PLACED
CONFIRMED
PROCESSING
PACKED
SHIPPED
OUT_FOR_DELIVERY
Completed Orders

Counts orders with:

DELIVERED

status.

Cancelled Orders

Counts orders with:

CANCELLED

status.

Pending Payments

Counts payment records with:

PENDING

status.

7. Low-Stock Calculation

Low-stock inventory is calculated using:

SELECT COUNT(*)
FROM inventory
WHERE quantity <= low_stock_threshold;

The calculation is performed at the inventory-record level.

Therefore, if multiple inventory records or variants belonging to a product meet the low-stock condition, each matching inventory record is counted.

The existing inventory implementation is reused without modifying the inventory module.

8. Analytics Charts

The Analytics module also provides six charts.

The chart data is provided by:

GET /api/admin/analytics/charts

The endpoint is protected by the same admin authentication and role-based access control used by the KPI endpoint.

8.1 Sales Over Time

Chart type: Line chart

Displays sales grouped by order creation date.

The backend groups orders by:

Order.created_at

and calculates:

SUM(Order.total_amount)

The frontend displays the result using a responsive Recharts LineChart.

8.2 Orders Over Time

Chart type: Line chart

Displays the number of orders created on each date.

The backend groups orders by:

Order.created_at

and calculates:

COUNT(Order.id)

The frontend displays the result using a responsive Recharts LineChart.

8.3 Top Products

Chart type: Bar chart

Displays the top products based on quantity sold.

The backend uses the relationship:

order_items
    ↓
products

The quantity is calculated using:

SUM(order_items.quantity)

The result is limited to the top 10 products.

The frontend displays the result using a responsive Recharts BarChart.

8.4 Top Categories

Chart type: Bar chart

Displays the top product categories based on quantity sold.

The backend uses:

order_items
    ↓
products
    ↓
categories

The quantity is calculated using:

SUM(order_items.quantity)

The result is grouped by category and limited to the top 10 categories.

8.5 Revenue by Category

Chart type: Bar chart

Displays revenue generated by each product category.

The backend uses:

order_items
    ↓
products
    ↓
categories

Revenue is calculated using:

SUM(order_items.quantity * order_items.unit_price)

The result is grouped by category.

8.6 Order Status Distribution

Chart type: Pie chart

Displays the number of orders for each current order status.

The backend groups orders by:

Order.status

and calculates:

COUNT(Order.id)

The frontend displays the result using a responsive Recharts PieChart.

9. Charts API Response
GET /api/admin/analytics/charts

Example response:

{
  "sales_over_time": [
    {
      "date": "2026-10-03",
      "sales": 600
    }
  ],
  "orders_over_time": [
    {
      "date": "2026-10-03",
      "orders": 3
    }
  ],
  "top_products": [],
  "top_categories": [],
  "revenue_by_category": [],
  "order_status_distribution": [
    {
      "status": "CANCELLED",
      "orders": 1
    },
    {
      "status": "DELIVERED",
      "orders": 1
    },
    {
      "status": "PLACED",
      "orders": 1
    }
  ]
}

The current database contains no rows in order_items.

Therefore:

top_products = []
top_categories = []
revenue_by_category = []

This is expected behavior and does not indicate a frontend chart error.

When order-item data exists, these charts will display the corresponding product and category information.

10. No-Data and Empty-Data Handling

The backend uses zero-safe aggregation where appropriate.

For example, when there are no matching records, the API returns 0 instead of failing.

The frontend also handles empty chart datasets.

When a chart has no data, the page displays:

No data available.

This prevents empty chart components from causing layout or rendering problems.

11. Admin Access and Security

Both Analytics endpoints require an authenticated administrator.

The backend uses the existing role-based access control:

require_role("admin")

The protected endpoints are:

GET /api/admin/analytics/summary
GET /api/admin/analytics/charts

Unauthenticated users are rejected.

Non-admin users are not permitted to access the Analytics endpoints.

No new authentication system was created.

The existing project authentication system is reused.

12. Frontend Implementation

Frontend page:

frontend/src/pages/admin/AnalyticsPage.tsx

The page:

Retrieves the current admin session using the existing authentication service.
Gets the admin JWT token.
Calls the KPI API.
Calls the Analytics Charts API.
Displays KPI cards.
Displays six analytics charts.
Handles loading states.
Handles API errors.
Handles empty chart datasets.
Uses responsive chart containers.

The authentication session is retrieved using:

getSession()

from:

frontend/src/services/authService.ts

The page does not use a separate analytics authentication mechanism.

13. Frontend API Integration

The API helpers are located in:

frontend/src/api.js

KPI request:

fetchAnalyticsSummary(token)

Charts request:

fetchAnalyticsCharts(token)

Both requests send the admin JWT using:

Authorization: Bearer <admin_token>
14. Responsive Design

The Analytics page is responsive.

The KPI cards use a responsive CSS grid:

repeat(auto-fit, minmax(180px, 1fr))

The chart sections use responsive grid layouts.

The charts use Recharts:

<ResponsiveContainer width="100%" height={300}>

or:

<ResponsiveContainer width="100%" height={320}>

Therefore the charts automatically resize according to the available container width.

The six charts are:

Sales Over Time
Orders Over Time
Top Products
Top Categories
Revenue by Category
Order Status Distribution
15. Admin Dashboard Integration

The Analytics page has been integrated into the existing Admin Dashboard.

The existing Admin Dashboard was not replaced or duplicated.

The Admin Dashboard implementation from:

feature/admin-dashboard

was merged into the Analytics branch.

The Analytics route was added to:

frontend/src/AdminApp.tsx

Route:

/admin/analytics

The route configuration uses:

<Route path="analytics" element={<AnalyticsPage />} />

Analytics was also added to:

frontend/src/config/adminNav.ts

using the Analytics navigation item:

Analytics

with the BarChart3 icon.

The integration was completed in the Analytics branch while preserving the existing Admin Dashboard structure.

16. Backend Integration

The Analytics router is located at:

backend/app/routers/analytics.py

The router is included in:

backend/app/main.py

The backend exposes:

/api/admin/analytics/summary
/api/admin/analytics/charts

The existing FastAPI application and database session are reused.

17. Database Integration

The Analytics module reads from the existing PostgreSQL database.

The following existing tables are used:

orders
order_items
users
roles
products
categories
payments
inventory

No new analytics database was created.

No existing business data was hard-coded into the Analytics page.

No new product or order data was created specifically for the Analytics implementation.

18. Verification

The Analytics API was tested using an authenticated admin account.

KPI API

The endpoint:

GET /api/admin/analytics/summary

was successfully tested with admin authentication.

Charts API

The endpoint:

GET /api/admin/analytics/charts

was successfully tested with admin authentication.

Example current chart data includes:

Sales Over Time
2026-10-03 → ₹600

Orders Over Time
2026-10-03 → 3 orders

Order Status Distribution
CANCELLED → 1
DELIVERED → 1
PLACED → 1

The product/category charts currently return empty arrays because the order_items table currently contains no records.

19. Database Order Verification

The current database contains the following test orders:

Order ID	Status	Total
27	PLACED	₹100
28	DELIVERED	₹200
29	CANCELLED	₹300

Therefore:

Total Orders = 3

and:

Total Revenue = ₹100 + ₹200 + ₹300
              = ₹600

The orders also provide coverage for:

Pending order
Completed order
Cancelled order
Multiple orders
Revenue calculation
20. Order Items Verification

The Analytics product/category charts depend on:

order_items

The current database was checked and returned:

[]

Therefore there are currently no order-item records.

As a result:

Top Products → No data available
Top Categories → No data available
Revenue by Category → No data available

This is expected based on the current database state.

The Analytics implementation does not create artificial order-item data merely to populate the charts.

21. Security Testing
Unauthorized Access

The Analytics Charts API was tested without valid authentication.

Result:

HTTP 401 — Not authenticated

This confirms that unauthenticated users cannot access the Analytics endpoint.

Invalid Authentication

The API was also tested with an invalid/expired token.

Result:

HTTP 401 — Invalid or expired token
Admin Access

The endpoint was tested using a valid admin session.

Result:

HTTP 200

The API returned the expected analytics data.

Non-Admin Access

Non-admin access has not yet been independently tested because suitable customer credentials were not available during verification.

22. Frontend Build Test

The frontend production build was tested using:

npm.cmd run build

Build completed successfully.

The latest build result:

vite v8.3.1 building client environment for production...
✓ 2566 modules transformed.
✓ built successfully

No frontend build errors were reported.

23. Backend Syntax Verification

The Analytics backend file was checked using:

.\venv\Scripts\python.exe -m py_compile app\routers\analytics.py

The command completed without errors.

This confirms that:

backend/app/routers/analytics.py

has valid Python syntax.

24. Implemented Files

The Analytics implementation modified the following files:

backend/app/routers/analytics.py
backend/app/main.py
frontend/src/pages/admin/AnalyticsPage.tsx
frontend/src/api.js
frontend/src/AdminApp.tsx
frontend/src/config/adminNav.ts
frontend/package.json
frontend/package-lock.json
docs/admin-analytics.md

Existing authentication, order, payment, product, category, inventory, and Admin Dashboard logic is reused.

No separate analytics database was created.

25. Verification Checklist
Requirement	Status
Admin Analytics API	Completed
Core KPI calculations	Completed
Real PostgreSQL data	Completed
Low-stock calculation	Completed
Admin-only access	Completed
Analytics frontend page	Completed
Reusable KPI cards	Completed
Sales Over Time chart	Completed
Orders Over Time chart	Completed
Top Products chart	Completed
Top Categories chart	Completed
Revenue by Category chart	Completed
Order Status Distribution chart	Completed
Responsive charts	Completed
Empty chart handling	Completed
KPI API testing	Completed
Charts API testing	Completed
Database verification	Completed
Unauthorized access testing	Completed
Admin access testing	Completed
Backend syntax verification	Completed
Frontend build verification	Completed
Admin Dashboard route integration	Completed
Admin navigation integration	Completed
Positive low-stock test	Pending suitable inventory data
Non-admin access test	Pending suitable customer credentials
Commit	Pending
Push	Pending
Pull Request	Pending
26. Definition of Done

The following requirements have been completed:

 Admin Analytics API implemented
 Core KPI calculations implemented
 Real PostgreSQL data used
 Low-stock inventory data integrated
 Admin-only access implemented
 Analytics frontend page created
 Reusable KPI cards created
 Sales Over Time chart implemented
 Orders Over Time chart implemented
 Top Products chart implemented
 Top Categories chart implemented
 Revenue by Category chart implemented
 Order Status Distribution chart implemented
 Responsive chart layout implemented
 Empty-data handling implemented
 API tested
 Database values verified
 Multiple order statuses tested
 Pending payment tested
 Unauthorized access tested
 Admin access tested
 Backend syntax verified
 Frontend build verified
 Documentation updated
 Admin Dashboard integration completed
 Analytics route added
 Analytics navigation added

 Final Git workflow remaining:

 Review staged changes
 Commit
 Push branch
 Create Pull Request
 Share PR with team/leader
27. Commit

Recommended commit message:

feat: implement admin analytics dashboard
28. Pull Request

The Pull Request should describe the following:

Implemented
Admin Analytics KPI dashboard
Six responsive analytics charts
Analytics summary API
Analytics charts API
Admin authentication and authorization
PostgreSQL-based analytics
Admin Dashboard route integration
Analytics navigation item
Empty-data handling
Frontend API integration
Documentation
Verification
Backend syntax verified
Frontend production build successful
KPI API tested
Charts API tested
Admin authentication tested
Unauthorized access tested
Database values verified
Known limitations
Product/category charts currently have no data because order_items contains no records.
Positive low-stock testing requires suitable inventory data.
Non-admin access testing requires a suitable customer account.
29. Final Status

The Admin Analytics implementation is functionally complete.

The remaining Git tasks are:

Review
   ↓
Commit
   ↓
Push feature/admin-analytics
   ↓
Create Pull Request
   ↓
   Share PR with team/leader