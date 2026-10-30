
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_current_user
from app.database import Base, get_db
from app.models.category import Category
from app.routers import category as category_router


ADMIN = SimpleNamespace(
    id=9,
    role=SimpleNamespace(name="admin"),
)


@pytest.fixture()
def env():
    # Temporary in-memory SQLite database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine, tables=[Category.__table__])

    Session = sessionmaker(bind=engine)

    app = FastAPI()
    app.include_router(category_router.router)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: ADMIN

    client = TestClient(app)

    yield SimpleNamespace(client=client, Session=Session)

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine, tables=[Category.__table__])
    engine.dispose()


def create_test_category(client, name="Electronics"):
    response = client.post(
        "/api/admin/categories/",
        json={"name": name, "description": "Test category"},
    )
    assert response.status_code == 201
    return response.json()


def test_create_category(env):
    response = env.client.post(
        "/api/admin/categories/",
        json={"name": "Electronics", "description": "Electronic products"},
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Electronics"
    assert response.json()["is_active"] is True


def test_update_category_is_active(env):
    category = create_test_category(env.client)

    response = env.client.put(
        f"/api/admin/categories/{category['id']}",
        json={"is_active": False},
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_delete_category_soft_deletes_and_returns_category(env):
    category = create_test_category(env.client)
    category_id = category["id"]

    response = env.client.delete(
        f"/api/admin/categories/{category_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == category_id
    assert response.json()["is_active"] is False

    # The category still exists; it was not permanently deleted.
    with env.Session() as db:
        saved_category = db.get(Category, category_id)
        assert saved_category is not None
        assert saved_category.is_active is False


def test_inactive_category_hidden_from_default_list(env):
    category = create_test_category(env.client)

    env.client.delete(
        f"/api/admin/categories/{category['id']}"
    )

    response = env.client.get("/api/admin/categories/")

    assert response.status_code == 200
    assert all(
        item["id"] != category["id"]
        for item in response.json()
    )


def test_include_inactive_categories(env):
    category = create_test_category(env.client)

    env.client.delete(
        f"/api/admin/categories/{category['id']}"
    )

    response = env.client.get(
        "/api/admin/categories/?include_inactive=true"
    )

    assert response.status_code == 200
    matching = [
        item for item in response.json()
        if item["id"] == category["id"]
    ]

    assert len(matching) == 1
    assert matching[0]["is_active"] is False


def test_delete_nonexistent_category_returns_404(env):
    response = env.client.delete("/api/admin/categories/99999")

    assert response.status_code == 404


def test_update_nonexistent_category_returns_404(env):
    response = env.client.put(
        "/api/admin/categories/99999",
        json={"is_active": False},
    )

    assert response.status_code == 404
