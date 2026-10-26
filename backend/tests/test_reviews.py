import pkgutil
import importlib
import pytest
from fastapi.testclient import TestClient

# 1. backend/app/models ke saare modules ko auto-load karein taaki koi bhi relationship na chhoote
import app.models
for _, module_name, _ in pkgutil.walk_packages(app.models.__path__, app.models.__name__ + "."):
    try:
        importlib.import_module(module_name)
    except Exception:
        pass

from app.database import Base, engine

# 2. Database tables create karein
Base.metadata.create_all(bind=engine)

# 3. FastAPI app import karein
from app.main import app as fastapi_app

client = TestClient(fastapi_app)


def test_get_product_reviews():
    # Test retrieving reviews for a product
    response = client.get("/api/products/1/reviews?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "reviews" in data
    assert "average_rating" in data
    assert "total_reviews" in data
    assert isinstance(data["reviews"], list)


def test_post_review_success():
    # Test submitting a valid review
    payload = {
        "product_id": 1,
        "user_id": 1,
        "order_id": 9821,
        "rating": 5,
        "title": "Outstanding Sound Quality",
        "comment": "Testing automated review submission."
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code in [200, 201]
    res_data = response.json()
    assert res_data["rating"] == 5
    assert res_data["title"] == "Outstanding Sound Quality"


def test_post_review_invalid_rating():
    # Test submitting an out-of-range rating (e.g., 6 stars)
    payload = {
        "product_id": 1,
        "user_id": 1,
        "order_id": 9821,
        "rating": 6,
        "title": "Invalid",
        "comment": "Rating should fail validation"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 422