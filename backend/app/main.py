
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services import order_service
from app.services.inventory_service import on_order_status_change
from app.services.cod_payment_hook import on_cod_order_change
from app.services.order_notification_hook import on_order_notification
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
    cart,
    payment,
    checkout_sessions,
    shipping_methods,
)
from app.api.routes import product, checkout, inventory

app = FastAPI(title="Customer Dashboard & Reviews API")

# Inventory stock deduction/restocking and COD payment hooks.
order_service.register_status_hook(on_order_status_change)
order_service.register_status_hook(on_cod_order_change)
order_service.register_status_hook(on_order_notification)

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
from app.routers import invoice
app.include_router(invoice.router)
app.include_router(checkout_sessions.router)
app.include_router(checkout_sessions.address_router)
app.include_router(product.router)
app.include_router(checkout.router)
app.include_router(cart.router)
app.include_router(shipping_methods.router)


app.include_router(inventory.router)

@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}
