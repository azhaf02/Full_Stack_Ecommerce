from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import DATABASE_URL, Base, engine
from app.models.checkout_session import CheckoutSession
from app.routers import account, checkout_sessions, notifications, reviews
app = FastAPI(title="Customer Dashboard & Checkout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)
app.include_router(account.router)

# Create only the checkout session table in local SQLite.
# Do not automatically modify the shared PostgreSQL database.
if DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine, tables=[CheckoutSession.__table__])


@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}
