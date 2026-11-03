from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_checkout_cors_allows_configured_frontend_origin():
    response = client.options(
        "/api/checkout/review",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.headers.get("access-control-allow-origin") == (
        "http://localhost:5173"
    )


def test_checkout_cors_does_not_approve_untrusted_origin():
    response = client.options(
        "/api/checkout/review",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.headers.get("access-control-allow-origin") != (
        "https://evil.example"
    )
