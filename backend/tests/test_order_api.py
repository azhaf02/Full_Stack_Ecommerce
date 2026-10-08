from datetime import timedelta
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_current_user
from app.database import Base, get_db
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory
from app.routers import orders as orders_router
from app.services import order_service
from app.services.inventory_service import on_order_status_change
from app.services.order_service import (
    OrderInput, OrderItemInput, create_order, apply_payment_result, update_status, utcnow,
    clear_status_hooks, register_status_hook,
)

TABLES = [
    Order.__table__,
    OrderItem.__table__,
    OrderStatusHistory.__table__,
    Return.__table__,
    ReturnItem.__table__,
    Inventory.__table__,
    InventoryHistory.__table__,
]
CUSTOMER = SimpleNamespace(id=1, role=SimpleNamespace(name="customer"))
OTHER_CUSTOMER = SimpleNamespace(id=2, role=SimpleNamespace(name="customer"))
ADMIN = SimpleNamespace(id=9, role=SimpleNamespace(name="admin"))


@pytest.fixture()
def env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    from app.models.address import Address
    from app.models.role import Role
    from app.models.user import User

    Base.metadata.create_all(
        engine,
        tables=TABLES + [
            Role.__table__,
            User.__table__,
            Address.__table__,
        ]
    )

    Session = sessionmaker(bind=engine)

    with Session() as db:
        db.add_all([
            Inventory(
                product_id=10,
                variant_id=None,
                quantity=100,
                low_stock_threshold=10,
                status="IN_STOCK",
            ),
            Inventory(
                product_id=11,
                variant_id=None,
                quantity=100,
                low_stock_threshold=10,
                status="IN_STOCK",
            ),
        ])
        db.commit()

    who = {"user": CUSTOMER}

    app = FastAPI()
    app.include_router(orders_router.router)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: who["user"]

    clear_status_hooks()
    register_status_hook(on_order_status_change)

    client = TestClient(app)

    yield SimpleNamespace(
        client=client,
        Session=Session,
        who=who,
        app=app
    )

    clear_status_hooks()


def make(env, user_id=1, method="ONLINE", paid=True, advance_to=None):
    """Create an order directly through the service (checkout isn't built yet) and optionally move it along."""
    with env.Session() as db:
        order = create_order(db, OrderInput(
            user_id=user_id, address_id=1, shipping_method_id=1, payment_method=method,
            items=[OrderItemInput(product_id=10, quantity=2, unit_price=Decimal("50.00")),
                   OrderItemInput(product_id=11, quantity=1, unit_price=Decimal("20.00"))],
            subtotal=Decimal("120.00"), total_amount=Decimal("120.00")))
        if paid and method == "ONLINE":
            apply_payment_result(db, order, "SUCCESS")
        path = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
        if advance_to:
            for step in path[:path.index(advance_to) + 1]:
                update_status(db, order, step)
        db.commit()
        return order.id


def item_ids(env, order_id):
    with env.Session() as db:
        return [i.id for i in db.get(Order, order_id).items]


# ------------------------------------------------------------------ authentication and roles

def test_every_route_needs_a_login(env):
    env.app.dependency_overrides.pop(get_current_user)
    c = env.client
    assert c.get("/api/account/orders").status_code == 401
    assert c.get("/api/account/orders/1").status_code == 401
    assert c.post("/api/account/orders/1/cancel").status_code == 401
    assert c.post("/api/account/orders/1/return", json={}).status_code == 401
    assert c.put("/api/admin/orders/1/status", json={"status": "CONFIRMED"}).status_code == 401
    assert c.get("/api/admin/returns").status_code == 401
    assert c.put("/api/admin/returns/1", json={"action": "approve"}).status_code == 401


def test_customers_cannot_use_admin_routes(env):
    c = env.client
    assert c.put("/api/admin/orders/1/status", json={"status": "CONFIRMED"}).status_code == 403
    assert c.get("/api/admin/returns").status_code == 403
    assert c.put("/api/admin/returns/1", json={"action": "approve"}).status_code == 403


def test_admins_cannot_use_customer_routes(env):
    env.who["user"] = ADMIN
    assert env.client.get("/api/account/orders").status_code == 403
    assert env.client.post("/api/account/orders/1/cancel").status_code == 403


# ------------------------------------------------------------------ my orders

def test_list_shows_only_my_orders_newest_first(env):
    first, second = make(env), make(env)
    make(env, user_id=2)
    body = env.client.get("/api/account/orders").json()
    assert [o["id"] for o in body] == [second, first]
    assert set(body[0]) >= {"id", "order_number", "status", "payment_method", "payment_status", "total_amount", "created_at"}


def test_list_is_paginated(env):
    ids = [make(env) for _ in range(5)]
    page = env.client.get("/api/account/orders", params={"page": 2, "page_size": 2}).json()
    assert [o["id"] for o in page] == [ids[2], ids[1]]
    assert env.client.get("/api/account/orders", params={"page_size": 500}).status_code == 422
    assert env.client.get("/api/account/orders", params={"page": 0}).status_code == 422


def test_order_detail_has_items_timeline_and_actions(env):
    order_id = make(env)
    body = env.client.get(f"/api/account/orders/{order_id}").json()
    assert body["status"] == "CONFIRMED" and body["payment_status"] == "SUCCESS"
    assert [i["quantity"] for i in body["items"]] == [2, 1]
    assert [h["new_status"] for h in body["status_history"]] == ["PLACED", "CONFIRMED"]
    assert body["actions"] == {"can_cancel": True, "can_request_return": False, "return_deadline": None,
                               "allowed_next_statuses": None}  # customers never see the admin options
    assert float(body["total_amount"]) == 120.0


def test_cannot_see_someone_elses_order_or_a_missing_one(env):
    theirs = make(env, user_id=2)
    assert env.client.get(f"/api/account/orders/{theirs}").status_code == 404
    assert env.client.get("/api/account/orders/99999").status_code == 404


# ------------------------------------------------------------------ cancel

def test_cancel_a_paid_order_starts_the_refund(env):
    order_id = make(env)
    r = env.client.post(f"/api/account/orders/{order_id}/cancel", json={"reason": "changed my mind"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "REFUND_PENDING" and body["payment_status"] == "REFUND_PENDING"
    assert body["status_history"][-2]["remarks"] == "changed my mind"
    assert body["actions"]["can_cancel"] is False


def test_cancel_without_a_body_works(env):
    order_id = make(env, method="COD")
    assert env.client.post(f"/api/account/orders/{order_id}/cancel").json()["status"] == "CANCELLED"


def test_cannot_cancel_a_packed_order(env):
    order_id = make(env, advance_to="PACKED")
    r = env.client.post(f"/api/account/orders/{order_id}/cancel")
    assert r.status_code == 409 and "can no longer be cancelled" in r.json()["detail"]


def test_cannot_cancel_someone_elses_order(env):
    theirs = make(env, user_id=2)
    assert env.client.post(f"/api/account/orders/{theirs}/cancel").status_code == 404
    with env.Session() as db:
        assert db.get(Order, theirs).status == "CONFIRMED"


def test_a_failing_hook_rolls_the_cancellation_back(env):
    order_id = make(env)

    def out_of_stock(*args):
        raise RuntimeError("stock service down")

    register_status_hook(out_of_stock)
    client = TestClient(env.app, raise_server_exceptions=False)
    assert client.post(f"/api/account/orders/{order_id}/cancel").status_code == 500
    with env.Session() as db:
        order = db.get(Order, order_id)
        assert order.status == "CONFIRMED"
        assert [h.new_status for h in order.status_history] == ["PLACED", "CONFIRMED"]


# ------------------------------------------------------------------ returns (customer)

def test_request_a_return_for_a_delivered_order(env):
    order_id = make(env, advance_to="DELIVERED")
    detail = env.client.get(f"/api/account/orders/{order_id}").json()
    assert detail["actions"]["can_request_return"] is True and detail["actions"]["return_deadline"]
    first, _ = item_ids(env, order_id)
    r = env.client.post(f"/api/account/orders/{order_id}/return",
                        json={"reason": "damaged", "items": [{"order_item_id": first, "quantity": 1}]})
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "REQUESTED" and body["items"] == [{"order_item_id": first, "quantity": 1}]
    after = env.client.get(f"/api/account/orders/{order_id}").json()
    assert after["status"] == "RETURN_REQUESTED" and len(after["returns"]) == 1
    assert after["actions"]["can_request_return"] is False


def test_return_rules_are_enforced(env):
    c = env.client
    not_delivered = make(env)
    first = item_ids(env, not_delivered)[0]
    assert c.post(f"/api/account/orders/{not_delivered}/return",
                  json={"reason": "x", "items": [{"order_item_id": first, "quantity": 1}]}).status_code == 409

    delivered = make(env, advance_to="DELIVERED")
    first = item_ids(env, delivered)[0]
    bad_item = c.post(f"/api/account/orders/{delivered}/return",
                      json={"reason": "x", "items": [{"order_item_id": 99999, "quantity": 1}]})
    too_many = c.post(f"/api/account/orders/{delivered}/return",
                      json={"reason": "x", "items": [{"order_item_id": first, "quantity": 3}]})
    assert bad_item.status_code == 422 and too_many.status_code == 422
    for body in ({"reason": "", "items": [{"order_item_id": first, "quantity": 1}]},
                 {"reason": "x", "items": []},
                 {"reason": "x", "items": [{"order_item_id": first, "quantity": 0}]}):
        assert c.post(f"/api/account/orders/{delivered}/return", json=body).status_code == 422
    with env.Session() as db:
        assert db.get(Order, delivered).status == "DELIVERED"


def test_return_after_seven_days_is_refused(env):
    order_id = make(env, advance_to="DELIVERED")
    with env.Session() as db:
        for h in db.get(Order, order_id).status_history:
            if h.new_status == "DELIVERED":
                h.changed_at = utcnow() - timedelta(days=8)
        db.commit()
    assert env.client.get(f"/api/account/orders/{order_id}").json()["actions"]["can_request_return"] is False
    first = item_ids(env, order_id)[0]
    r = env.client.post(f"/api/account/orders/{order_id}/return",
                        json={"reason": "late", "items": [{"order_item_id": first, "quantity": 1}]})
    assert r.status_code == 409 and "window" in r.json()["detail"]


def test_cannot_return_someone_elses_order(env):
    theirs = make(env, user_id=2, advance_to="DELIVERED")
    first = item_ids(env, theirs)[0]
    r = env.client.post(f"/api/account/orders/{theirs}/return",
                        json={"reason": "x", "items": [{"order_item_id": first, "quantity": 1}]})
    assert r.status_code == 404


# ------------------------------------------------------------------ admin: status

def test_admin_moves_an_order_forward_and_it_is_logged(env):
    order_id = make(env)
    env.who["user"] = ADMIN
    r = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "PROCESSING", "remarks": "picking"})
    assert r.status_code == 200 and r.json()["status"] == "PROCESSING"
    last = r.json()["status_history"][-1]
    assert (last["previous_status"], last["new_status"], last["changed_by"], last["remarks"]) == (
        "CONFIRMED", "PROCESSING", 9, "picking")


def test_admin_cannot_skip_steps_or_use_an_unknown_status(env):
    order_id = make(env)
    env.who["user"] = ADMIN
    assert env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "DELIVERED"}).status_code == 409
    assert env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "TELEPORTED"}).status_code == 422
    assert env.client.put("/api/admin/orders/99999/status", json={"status": "PROCESSING"}).status_code == 404


def test_admin_cannot_confirm_an_unpaid_online_order(env):
    order_id = make(env, paid=False)
    env.who["user"] = ADMIN
    r = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "CONFIRMED"})
    assert r.status_code == 409 and "not SUCCESS" in r.json()["detail"]


def test_return_steps_cannot_be_done_through_the_status_route(env):
    order_id = make(env, advance_to="DELIVERED")
    env.who["user"] = ADMIN
    r = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "RETURN_REQUESTED"})
    assert r.status_code == 409 and "returns workflow" in r.json()["detail"]


# ------------------------------------------------------------------ admin: returns

def customer_return(env, order_id, quantity=1):
    env.who["user"] = CUSTOMER
    first = item_ids(env, order_id)[0]
    r = env.client.post(f"/api/account/orders/{order_id}/return",
                        json={"reason": "damaged", "items": [{"order_item_id": first, "quantity": quantity}]})
    assert r.status_code == 201
    env.who["user"] = ADMIN
    return r.json()["id"]


def test_admin_runs_a_return_through_to_the_refund(env):
    order_id = make(env, advance_to="DELIVERED")
    return_id = customer_return(env, order_id)

    listed = env.client.get("/api/admin/returns", params={"status": "REQUESTED"}).json()
    assert [r["id"] for r in listed] == [return_id]

    r = env.client.put(f"/api/admin/returns/{return_id}", json={"action": "approve", "remarks": "ok"})
    assert r.status_code == 200 and r.json()["status"] == "APPROVED" and r.json()["admin_remarks"] == "ok"
    r = env.client.put(f"/api/admin/returns/{return_id}", json={"action": "mark_returned"})
    assert r.json()["status"] == "REFUND_PENDING" and float(r.json()["refund_amount"]) == 50.0
    r = env.client.put(f"/api/admin/returns/{return_id}", json={"action": "complete_refund"})
    assert r.json()["status"] == "REFUNDED"

    with env.Session() as db:
        order = db.get(Order, order_id)
        assert order.status == "REFUNDED" and order.payment_status == "REFUNDED"
    assert env.client.get("/api/admin/returns", params={"status": "REQUESTED"}).json() == []


def test_admin_rejects_a_return_and_the_order_goes_back_to_delivered(env):
    order_id = make(env, advance_to="DELIVERED")
    return_id = customer_return(env, order_id)
    r = env.client.put(f"/api/admin/returns/{return_id}", json={"action": "reject", "remarks": "outside policy"})
    assert r.json()["status"] == "REJECTED"
    with env.Session() as db:
        assert db.get(Order, order_id).status == "DELIVERED"


def test_return_steps_must_happen_in_order(env):
    order_id = make(env, advance_to="DELIVERED")
    return_id = customer_return(env, order_id)
    assert env.client.put(f"/api/admin/returns/{return_id}", json={"action": "complete_refund"}).status_code == 409
    assert env.client.put(f"/api/admin/returns/{return_id}", json={"action": "mark_returned"}).status_code == 409
    env.client.put(f"/api/admin/returns/{return_id}", json={"action": "approve"})
    assert env.client.put(f"/api/admin/returns/{return_id}", json={"action": "approve"}).status_code == 409


def test_admin_return_route_validation(env):
    env.who["user"] = ADMIN
    assert env.client.put("/api/admin/returns/99999", json={"action": "approve"}).status_code == 404
    assert env.client.put("/api/admin/returns/1", json={"action": "explode"}).status_code == 422
    assert env.client.get("/api/admin/returns", params={"status": "BOGUS"}).status_code == 422


def test_order_status_route_is_blocked_while_a_return_is_open(env):
    order_id = make(env, advance_to="DELIVERED")
    return_id = customer_return(env, order_id)
    env.client.put(f"/api/admin/returns/{return_id}", json={"action": "approve"})
    env.client.put(f"/api/admin/returns/{return_id}", json={"action": "mark_returned"})
    r = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "REFUNDED"})
    assert r.status_code == 409 and "returns workflow" in r.json()["detail"]


# ------------------------------------------------------------------ wiring

def test_routes_are_registered_in_the_real_app():
    from app.main import app
    # The OpenAPI schema lists every route however the framework stores included routers.
    schema_paths = app.openapi()["paths"]
    paths = {(method.upper(), path) for path, methods in schema_paths.items() for method in methods}
    for expected in [("GET", "/api/account/orders"), ("GET", "/api/account/orders/{order_id}"),
                     ("POST", "/api/account/orders/{order_id}/cancel"), ("POST", "/api/account/orders/{order_id}/return"),
                     ("PUT", "/api/admin/orders/{order_id}/status"), ("GET", "/api/admin/returns"),
                     ("PUT", "/api/admin/returns/{return_id}")]:
        assert expected in paths


# ------------------------------------------------------------------ real login tokens (no faked user)

def test_works_with_real_jwt_tokens_from_the_auth_module(env):
    from app.core.security import create_access_token
    from app.models.role import Role
    from app.models.user import User

    Base.metadata.create_all(env.Session.kw["bind"], tables=[Role.__table__, User.__table__])
    with env.Session() as db:
        customer_role, admin_role = Role(name="customer"), Role(name="admin")
        db.add_all([customer_role, admin_role])
        db.flush()
        users = {
            "customer": User(id=1, name="C", email="c@example.com", password_hash="x", role_id=customer_role.id),
            "admin": User(id=9, name="A", email="a@example.com", password_hash="x", role_id=admin_role.id),
            "inactive": User(id=3, name="I", email="i@example.com", password_hash="x", role_id=customer_role.id,
                             status="disabled"),
        }
        db.add_all(users.values())
        db.commit()
        tokens = {name: create_access_token(db.get(User, u.id)) for name, u in users.items()}

    env.app.dependency_overrides.pop(get_current_user)
    order_id = make(env)
    bearer = lambda name: {"Authorization": f"Bearer {tokens[name]}"}
    c = env.client

    mine = c.get("/api/account/orders", headers=bearer("customer"))
    assert mine.status_code == 200 and [o["id"] for o in mine.json()] == [order_id]
    assert c.get("/api/account/orders", headers=bearer("admin")).status_code == 403
    assert c.get("/api/admin/returns", headers=bearer("customer")).status_code == 403
    assert c.get("/api/admin/returns", headers=bearer("admin")).status_code == 200
    moved = c.put(f"/api/admin/orders/{order_id}/status", json={"status": "PROCESSING"}, headers=bearer("admin"))
    assert moved.status_code == 200 and moved.json()["status_history"][-1]["changed_by"] == 9
    assert c.get("/api/account/orders", headers={"Authorization": "Bearer not-a-token"}).status_code == 401
    assert c.get("/api/account/orders", headers=bearer("inactive")).status_code == 401


def test_admin_response_lists_what_can_be_chosen_next(env):
    order_id = make(env)
    env.who["user"] = ADMIN
    moved = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": "PROCESSING"}).json()
    assert moved["actions"]["allowed_next_statuses"] == ["PACKED", "CANCELLED"]
    # and every status it lists is accepted
    for _ in range(4):
        options = moved["actions"]["allowed_next_statuses"]
        if not options:
            break
        moved = env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": options[0]})
        assert moved.status_code == 200
        moved = moved.json()
    assert moved["status"] == "DELIVERED" and moved["actions"]["allowed_next_statuses"] == []


def test_admin_history_records_every_change_in_order(env):
    order_id = make(env)
    env.who["user"] = ADMIN
    for step, note in [("PROCESSING", "picking"), ("PACKED", "boxed"), ("SHIPPED", "handed to courier")]:
        env.client.put(f"/api/admin/orders/{order_id}/status", json={"status": step, "remarks": note})
    env.who["user"] = CUSTOMER
    history = env.client.get(f"/api/account/orders/{order_id}").json()["status_history"]
    assert [(h["previous_status"], h["new_status"], h["changed_by"], h["remarks"]) for h in history][2:] == [
        ("CONFIRMED", "PROCESSING", 9, "picking"), ("PROCESSING", "PACKED", 9, "boxed"),
        ("PACKED", "SHIPPED", 9, "handed to courier")]
    assert all(h["changed_at"] for h in history)


# ------------------------------------------------------------------ admin order detail

def _seed_customer_and_address(env):
    from app.models.address import Address
    from app.models.role import Role
    from app.models.user import User

    Base.metadata.create_all(env.Session.kw["bind"], tables=[Role.__table__, User.__table__, Address.__table__])
    with env.Session() as db:
        role = Role(name="customer")
        db.add(role)
        db.flush()
        db.add(User(id=1, name="Asha Rao", email="asha@example.com", password_hash="x", role_id=role.id))
        db.add(Address(id=1, user_id=1, full_name="Asha Rao", phone="9999999999", line1="12 MG Road",
                       city="Pune", state="MH", postal_code="411001"))
        db.commit()


def test_admin_can_read_one_order_with_customer_and_address(env):
    _seed_customer_and_address(env)
    order_id = make(env)
    env.who["user"] = ADMIN
    r = env.client.get(f"/api/admin/orders/{order_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == order_id and body["user_id"] == 1
    assert body["customer"] == {"id": 1, "name": "Asha Rao", "email": "asha@example.com"}
    assert body["address"]["city"] == "Pune" and body["address"]["line1"] == "12 MG Road"
    assert len(body["items"]) == 2 and body["status_history"]
    assert body["actions"]["allowed_next_statuses"] == ["PROCESSING", "CANCELLED"]


def test_admin_order_detail_survives_a_missing_customer_row(env):
    _seed_customer_and_address(env)
    order_id = make(env, user_id=42)
    env.who["user"] = ADMIN
    body = env.client.get(f"/api/admin/orders/{order_id}").json()
    assert body["customer"] is None and body["user_id"] == 42


def test_admin_order_detail_rules(env):
    _seed_customer_and_address(env)
    order_id = make(env)
    assert env.client.get(f"/api/admin/orders/{order_id}").status_code == 403   # customer
    env.who["user"] = ADMIN
    assert env.client.get("/api/admin/orders/9999").status_code == 404
    # customers' own detail does not leak admin-only fields
    env.who["user"] = CUSTOMER
    mine = env.client.get(f"/api/account/orders/{order_id}").json()
    assert "customer" not in mine and mine["actions"]["allowed_next_statuses"] is None
    env.app.dependency_overrides.pop(get_current_user)
    assert env.client.get(f"/api/admin/orders/{order_id}").status_code == 401
