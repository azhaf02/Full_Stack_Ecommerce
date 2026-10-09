from app.routers.shipping import router as shipping_router
from dotenv import load_dotenv
load_dotenv()  # loads DATABASE_URL / SECRET_KEY from backend/.env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import shipping_methods, notifications, reviews, account, auth, cart, orders
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Customer Dashboard & Reviews API")
# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers cleanly
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(account.router)  # addresses (Madeeha)
app.include_router(auth.router)  # login/register/admin login (Madeeha)
app.include_router(cart.router)
app.include_router(orders.router)
@app.get("/")
def root():
    return {"message": "Customer Dashboard Backend API is running"}
app.include_router(shipping_router)


app.include_router(shipping_methods.router)

