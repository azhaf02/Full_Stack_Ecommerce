Authentication, Authorization & Customer Account Management

Owner: Madeeha Peerzade · Branch: feature/authentication · Stack: React + TypeScript, FastAPI, PostgreSQL (Supabase), SQLAlchemy, JWT

1. Overview

This module securely identifies users, controls access by role, and manages customer account data. It provides customer registration, login and logout, admin login, profile and password management, and address management. Every other module relies on it to know who the current user is and what they are allowed to do.

2. User Roles
Role	Description	Main access
Guest	Not logged in	Browse products, register, login
Customer	Registered, authenticated user	Profile, addresses, orders, cart/checkout
Admin	Administrative user	Admin dashboard and protected management APIs

Roles are stored in the roles table (customer, admin). Guest is simply an unauthenticated request.

3. Role / Access Matrix
Function	Guest	Customer	Admin
View products	✓	✓	✓
Register	✓	—	—
Login	✓	✓	✓ (admin login)
Logout	—	✓	✓
Manage own profile / password	✗	✓	✓
Manage own addresses	✗	✓	✗
View own orders	✗	✓	—
Admin dashboard / manage products / manage users	✗	✗	✓
4. Authentication Flow
No
Yes
Yes
No
User opens VIORA
Register / Login form
React sends request
FastAPI validates input -Pydantic
Find user in PostgreSQL
Password valid and accountactive?
401 / 403 error, count failedattempt
Generate signed JWT: userid + role
React stores token inAuthContext
Protected request withAuthorization: Bearer token
get_current_user verifiessignature + expiry
require_role checks role
Allowed?
Return data
403 Forbidden
Registration: form → POST /api/auth/register → validation → duplicate-email check (409) → bcrypt hash → user saved with role customer.
Login: form → POST /api/auth/login → verify bcrypt hash → JWT returned. Wrong email and wrong password give the same generic error.
Admin login: POST /api/auth/admin/login → same check, but non-admin accounts are rejected. A customer token can never access admin APIs.
Logout: JWT is stateless; the frontend deletes the stored token and redirects to login/home. Tokens are short-lived (30 minutes by default).
5. Backend APIs

All paths are prefixed as shown. Protected endpoints need the header Authorization: Bearer <token>.

Auth (app/routers/auth.py)
Method	Endpoint	Access	Purpose
POST	/api/auth/register	Public	Create a customer account
POST	/api/auth/login	Public	Log in, returns JWT
POST	/api/auth/admin/login	Public	Admin-only login, returns JWT
POST	/api/auth/logout	Logged in	Confirms logout (client discards token)
GET	/api/auth/me	Logged in	Current user info

Register request

json
{ "name": "Madeeha", "email": "madeeha@example.com", "password": "secret123" }

Rules: name 2–100 chars, valid email, password 8–72 chars with letters and numbers.

Login request / response

json
{ "email": "madeeha@example.com", "password": "secret123" }
json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Madeeha", "email": "madeeha@example.com", "role": "customer", "status": "active", "created_at": "..." }
}
Account (app/routers/account.py)
Method	Endpoint	Access	Purpose
GET	/api/account/profile	Logged in	View own profile
PUT	/api/account/profile	Logged in	Update name
PUT	/api/account/password	Logged in	Change password (current password required)
GET	/api/account/addresses	Customer	List own addresses
POST	/api/account/addresses	Customer	Add address
GET	/api/account/addresses/{id}	Customer	Get one owned address
PUT	/api/account/addresses/{id}	Customer	Update owned address
DELETE	/api/account/addresses/{id}	Customer	Delete owned address
PUT	/api/account/addresses/{id}/default	Customer	Set default address

Address rules:

Every address query is filtered by the logged-in user's id; another customer's address returns 404.
The first address added becomes the default automatically.
Deleting the default address promotes another saved address to default, so checkout always has one if any exist.
address_type is shipping, billing or both (used by Checkout).
6. Database Tables (owned by this module)

Migration: backend/alembic/versions/0001_users_roles_addresses.py (revision 0001_users_roles_addresses).

roles

Column	Type	Notes
id	Integer	PK
name	String(20)	Unique: customer, admin (seeded by migration)

users

Column	Type	Notes
id	Integer	PK; other modules use ForeignKey("users.id")
name	String(100)	Required
email	String(255)	Unique, indexed
password_hash	String(255)	bcrypt hash, never plain text
role_id	Integer	FK → roles.id
status	String(20)	active / inactive (admin can deactivate)
created_at, updated_at	Timestamp	Auto

addresses

Column	Type	Notes
id	Integer	PK
user_id	Integer	FK → users.id, cascade delete, indexed
full_name, phone	String	Required
line1, line2	String	line2 optional
city, state, postal_code, country	String	country defaults to India
address_type	String(20)	shipping / billing / both
is_default	Boolean	One default per user
created_at, updated_at	Timestamp	Auto

The User model also exposes notifications and reviews relationships for the Customer Dashboard module.

7. Integration Guide for Other Modules

Shared dependencies live in app/core/security.py.

python
from fastapi import Depends
from app.core.security import get_current_user, require_role
from app.models.user import User

# any logged-in user
@router.get("/something")
def handler(user: User = Depends(get_current_user)):
    ...

# customers only (cart, checkout, orders, dashboard, support tickets)
@router.post("/something")
def handler(user: User = Depends(require_role("customer"))):
    ...

# admins only (admin dashboard, product management, inventory, analytics)
@router.put("/admin/something")
def handler(user: User = Depends(require_role("admin"))):
    ...
Link your tables to users with user_id = Column(Integer, ForeignKey("users.id")).
Always filter customer data by user.id (ownership check).
Responses: 401 missing/invalid/expired token, 403 wrong role or deactivated account.
Create the first admin: python create_admin.py from the backend folder.
To deactivate a customer (Admin module), set users.status = "inactive"; login and get_current_user then block them.
8. Security
Passwords hashed with bcrypt (passlib); never stored or returned in plain text.
JWT signed with SECRET_KEY from .env, 30-minute expiry, verified on every protected request.
Role checks happen on the backend (require_role); frontend route protection is only for UX.
Ownership checks on all address operations.
All input validated with Pydantic schemas; SQLAlchemy ORM prevents SQL injection.
Generic login error (does not reveal whether email exists).
Lockout: 5 failed logins within 15 minutes → 429 for 15 minutes (in-memory; resets on server restart).
.env is never committed; .env.example lists required variables.
CORS limited to the frontend origin; HTTPS in deployment.
Password reset (concept, not implemented): email a short-lived single-use token, verify it, then accept a new password.
9. Frontend Pages / Components
Page / Component	Protection	Status
Register page	Public	Pending
Login page	Public	Pending
Admin login (Rishi's AdminLoginPage uses /api/auth/admin/login)	Public	Pending
AuthContext + authService	—	Pending
ProtectedRoute	Customer / Admin	Pending
Profile page + edit form + change password	Customer	Pending
Address management + add/edit form	Customer	Pending
My Orders	Customer	Pending (needs Order Management API)
10. Dependencies with Other Modules
Module	What they get from Auth	What Auth needs
Customer Dashboard (Aliza)	users table, notifications / reviews relationships	—
Checkout (Safiya)	Address CRUD, address_type	—
Admin Dashboard (Rishi)	require_role("admin"), admin login, deactivation block	Admin feature list
Support (Tanzil)	get_current_user	—
Product Catalog (Chandani)	require_role("admin") for product management	Checkpoint 1 testing together
Cart (Zubiya)	JWT + get_current_user for guest-to-user cart merge	Merge endpoint contract
Order Management (Rukhsar)	user id for linking orders	"My orders" API contract
11. Testing Plan
Area	Test	Expected
Registration	Valid details	201, customer created
Registration	Existing email	409
Registration	Weak password / missing fields	422
Login	Valid credentials	200, JWT issued
Login	Wrong password / unknown email	401 generic message
Login	6th wrong attempt	429 lockout
Login	Deactivated account	403
Admin login	Customer account	401
JWT	Valid token on protected API	200
JWT	Missing / expired / invalid token	401
RBAC	Customer calls admin API	403
Ownership	Access another customer's address	404
Profile	Update name	200
Password	Wrong current password	400
Address	Add, edit, delete, set default	Saved for that customer only
Logout	Click logout	Token cleared, redirected
12. Status
Done: models + migration file, register, login, admin login, logout, JWT, get_current_user, require_role, profile, password change, address CRUD, lockout, create_admin.py, requirements.txt, .env.example.
Pending: migration order on the shared DB, frontend pages, automated tests, Checkpoint 1 integration.