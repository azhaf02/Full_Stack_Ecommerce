from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    notifications,
    reviews,
    admin,
    category,
    account,
    auth,
    audit_logs,
    orders,
)

app = FastAPI(title="Customer Dashboard & Reviews API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(category.router)

# Authentication / account / audit logging
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)
app.include_router(orders.router)  # orders, cancellation, returns (Rukhsar)


@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}