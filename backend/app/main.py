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
    analytics,
    orders,
    payment,
    checkout_sessions,
    shipping_methods,
)

from app.api.routes import product

app = FastAPI(title="Customer Dashboard & Reviews API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
         "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router)
app.include_router(reviews.router)

app.include_router(admin.router)
app.include_router(category.router)

app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)

app.include_router(analytics.router)

app.include_router(orders.router)

app.include_router(payment.router)

app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)

app.include_router(product.router)

app.include_router(shipping_methods.router)


@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}