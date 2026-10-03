import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

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
    # Accepts 200 or 201 depending on route definition
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
    # Should be rejected with 422 Unprocessable Entity
    assert response.status_code == 422