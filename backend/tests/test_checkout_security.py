from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import checkout as checkout_route


def make_client(authenticated=False):
    app = FastAPI()
    app.include_router(checkout_route.router)

    if authenticated:
        user = SimpleNamespace(
            id=1,
            role=SimpleNamespace(name="customer"),
        )
        app.dependency_overrides[checkout_route.customer_only] = lambda: user

    return TestClient(app), app


def test_checkout_review_requires_login():
    client, _ = make_client()

    response = client.post(
        "/api/checkout/review",
        json={"address_id": 1, "shipping_method_id": 1},
    )

    assert response.status_code == 401


def test_checkout_review_rejects_client_supplied_totals_and_prices():
    client, app = make_client(authenticated=True)
    request_data = {"address_id": 1, "shipping_method_id": 1}

    try:
        for field in ("total", "subtotal", "shipping_cost", "price"):
            response = client.post(
                "/api/checkout/review",
                json={**request_data, field: 1},
            )

            assert response.status_code == 422, (
                f"Expected client-supplied {field} to be rejected; "
                f"received {response.status_code}: {response.text}"
            )
    finally:
        app.dependency_overrides.clear()

class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def mappings(self):
        return self

    def first(self):
        return self.rows[0] if self.rows else None

    def all(self):
        return self.rows


class FakeDatabase:
    def execute(self, query, params=None):
        sql = str(query).lower()

        if "from addresses" in sql:
            return FakeResult([{
                "id": 1,
                "full_name": "Test Customer",
                "phone": "9999999999",
                "line1": "Test Road",
                "line2": None,
                "city": "Pune",
                "state": "Maharashtra",
                "postal_code": "411001",
                "country": "India",
                "address_type": "HOME",
            }])

        if "from shipping_methods" in sql:
            return FakeResult([{
                "id": 1,
                "name": "Standard",
                "cost": 50,
                "estimated_days": 5,
                "status": True,
            }])

        if "from carts" in sql:
            return FakeResult([{"id": 1}])

        if "from cart_items" in sql:
            return FakeResult([{
                "id": 1,
                "product_id": 5,
                "variant_id": None,
                "quantity": 1,
                "unit_price": 1,
            }])

        if "from product_variants" in sql:
            return FakeResult([])

        if "from products" in sql:
            return FakeResult([{
                "id": 5,
                "price": 100,
                "status": "ACTIVE",
            }])

        raise AssertionError(f"Unexpected database query: {sql}")


def test_checkout_review_rejects_tampered_cart_price():
    client, app = make_client(authenticated=True)

    app.dependency_overrides[checkout_route.get_db] = lambda: FakeDatabase()

    try:
        response = client.post(
            "/api/checkout/review",
            json={"address_id": 1, "shipping_method_id": 1},
        )

        assert response.status_code == 409, response.text
        assert "Price changed" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
