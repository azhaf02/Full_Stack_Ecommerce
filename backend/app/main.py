from dotenv import load_dotenv
load_dotenv()  # loads DATABASE_URL / SECRET_KEY from backend/.env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import notifications, reviews, account, auth, audit_logs, orders
from app.api.routes import product

app = FastAPI(title="Customer Dashboard & Reviews API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers cleanly
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(account.router)  # addresses (Madeeha)
app.include_router(auth.router)  # login/register/admin login (Madeeha)
app.include_router(audit_logs.router)
app.include_router(orders.router)  # orders, cancellation, returns (Rukhsar)
app.include_router(product.router)

@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}