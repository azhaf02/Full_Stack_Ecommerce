from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    notifications,
    reviews,
    account,
    auth,
    audit_logs,
    orders,
    checkout_sessions,
    shipping_methods,
)

app = FastAPI(title="Customer Dashboard & Reviews API")

# Enable CORS for React/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(account.router)                       # addresses
app.include_router(auth.router)                          # login/register
app.include_router(audit_logs.router)
app.include_router(orders.router)                        # orders
app.include_router(checkout_sessions.router)             # checkout sessions
app.include_router(checkout_sessions.address_router)     # checkout address
app.include_router(shipping_methods.router)              # shipping methods


@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}