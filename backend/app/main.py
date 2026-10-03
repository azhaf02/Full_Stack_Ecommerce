from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import notifications, reviews, account, auth, audit_logs
from app.api.routes.category import router as category_router
from app.api.routes.product import router as product_router


app = FastAPI(title="E-Commerce API")


# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Existing project routers
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(account.router)
app.include_router(auth.router)
app.include_router(audit_logs.router)


# Product Catalog routers
app.include_router(category_router)
app.include_router(product_router)


@app.get("/")
def root():
    return {"message": "E-Commerce Backend API is running"}