from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_addresses_requires_login():
    response = client.get("/api/account/addresses")

    assert response.status_code == 401


def test_checkout_address_requires_login():
    payload = {
        "full_name": "Test Customer",
        "phone": "9876543210",
        "line1": "Test Address",
        "line2": "",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "country": "India",
        "address_type": "both",
        "is_default": False,
    }

    response = client.post("/api/checkout/address", json=payload)

    assert response.status_code == 401


def test_checkout_address_rejects_invalid_phone_without_login():
    payload = {
        "full_name": "Test Customer",
        "phone": "123",
        "line1": "Test Address",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "country": "India",
        "address_type": "both",
        "is_default": False,
    }

    response = client.post("/api/checkout/address", json=payload)

    # Authentication is checked before creating the address.
    assert response.status_code in (401, 422)


def test_checkout_address_rejects_missing_required_fields_without_login():
    payload = {
        "full_name": "",
        "phone": "",
        "line1": "",
        "city": "",
        "state": "",
        "postal_code": "",
        "country": "India",
        "address_type": "both",
        "is_default": False,
    }

    response = client.post("/api/checkout/address", json=payload)

    assert response.status_code in (401, 422)