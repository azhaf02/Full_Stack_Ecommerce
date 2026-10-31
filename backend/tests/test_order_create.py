from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Boolean, Column, Integer, MetaData, Numeric, String, Table, create_engine, insert, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_current_user
from app.database import Base, get_db
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.routers import orders as orders_router
from app.services.order_service import (
    OutOfStock, apply_payment_result, clear_status_hooks, register_status_hook,
)

ORDER_TABLES = [Order.__table__, OrderItem.__table__, OrderStatusHistory.__table__,
                Return.__table__, ReturnItem.__table__]

# Stand-ins for tables owned by other modules (their models are not on main yet).
catalog = MetaData()
products = Table("products", catalog, Column("id", Integer, primary_key=True), Column("name", String),
                 Column("price", Numeric(10, 2)), Column("status", String))
variants = Table("product_variants", catalog, Column("id", Integer, primary_key=True),
                 Column("product_id", Integer), Column("price_delta", Numeric(10, 2)))
shipping = Table("shipping_methods", catalog, Column("id", Integer, primary_key=True),
                 Column("cost", Numeric(10, 2)), Column("status", Boolean))
addresses = Table("addresses", catalog, Column("id", Integer, primary_key=True), Column("user_id", Integer))

CUSTOMER = SimpleNamespace(id=1, role=SimpleNamespace(name="customer"))
ADMIN = SimpleNamespace(id=9, role=SimpleNamespace(name="admin"))


@pytest.fixture()
def env():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=ORDER_TABLES)
    catalog.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as db:
        db.execute(insert(products), [
            {"id": 1, "name": "T-Shirt", "price": "499.00", "status": "ACTIVE"},
            {"id": 2, "name": "Laptop", "price": "47999.00", "status": "INACTIVE"},
            {"id": 3, "name": "Shoe", "price": "100.00", "status": "ACTIVE"},
            {"id": 4, "name": "Hat", "price": "250.00", "status": "ACTIVE"}])
        db.execute(insert(variants), [{"id": 1, "product_id": 3, "price_delta": "25.00"},
                                      {"id": 2, "product_id": 3, "price_delta": "-10.00"}])
        db.execute(insert(shipping), [{"id": 1, "cost": "50.00", "status": True},
                                      {"id": 2, "cost": "100.00", "status": True},
                                      {"id": 3, "cost": "10.00", "status": False}])
        db.execute(insert(addresses), [{"id": 1, "user_id": 1}, {"id": 2, "user_id": 2}])
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
    yield SimpleNamespace(client=TestClient(app), Session=Session, who=who, app=app)
    clear_status_hooks()


def body(**overrides):
    base = {"address_id": 1, "shipping_method_id": 1, "payment_method": "COD",
            "items": [{"product_id": 1, "quantity": 2}]}
    base.update(overrides)
    return base


def order_count(env):
    with env.Session() as db:
        return db.query(Order).count()


# ------------------------------------------------------------------ the happy paths

def test_cod_order_is_priced_by_the_server_and_confirmed(env):
    r = env.client.post("/api/orders", json=body())
    assert r.status_code == 201
    order = r.json()
    assert order["order_number"].startswith("ORD-")
    assert order["status"] == "CONFIRMED" and order["payment_status"] == "PENDING"
    assert order["payment_method"] == "COD"
    assert float(order["subtotal"]) == 998.0 and float(order["shipping_cost"]) == 50.0
    assert float(order["total_amount"]) == 1048.0
    assert [(i["product_id"], i["quantity"], float(i["unit_price"])) for i in order["items"]] == [(1, 2, 499.0)]
    assert [h["new_status"] for h in order["status_history"]] == ["PLACED", "CONFIRMED"]
    assert order["status_history"][0]["changed_by"] == 1


def test_online_order_waits_as_placed_until_payment_is_verified(env):
    order = env.client.post("/api/orders", json=body(payment_method="ONLINE", shipping_method_id=2)).json()
    assert order["status"] == "PLACED" and order["payment_status"] == "PENDING"
    assert float(order["total_amount"]) == 998.0 + 100.0
    assert order["actions"]["can_cancel"] is True

    with env.Session() as db:
        apply_payment_result(db, db.get(Order, order["id"]), "SUCCESS")
        db.commit()
    assert env.client.get(f"/api/account/orders/{order['id']}").json()["status"] == "CONFIRMED"


def test_failed_payment_leaves_the_order_unconfirmed(env):
    order = env.client.post("/api/orders", json=body(payment_method="ONLINE")).json()
    with env.Session() as db:
        apply_payment_result(db, db.get(Order, order["id"]), "FAILED")
        db.commit()
    again = env.client.get(f"/api/account/orders/{order['id']}").json()
    assert again["status"] == "PLACED" and again["payment_status"] == "FAILED"


def test_variant_price_is_the_product_price_plus_the_variant_difference(env):
    items = [{"product_id": 3, "variant_id": 1, "quantity": 2}, {"product_id": 3, "variant_id": 2, "quantity": 1}]
    order = env.client.post("/api/orders", json=body(items=items)).json()
    assert sorted((i["variant_id"], float(i["unit_price"])) for i in order["items"]) == [(1, 125.0), (2, 90.0)]
    assert float(order["subtotal"]) == 125.0 * 2 + 90.0


def test_the_same_product_listed_twice_becomes_one_line(env):
    items = [{"product_id": 1, "quantity": 1}, {"product_id": 1, "quantity": 2}, {"product_id": 4, "quantity": 1}]
    order = env.client.post("/api/orders", json=body(items=items)).json()
    assert sorted((i["product_id"], i["quantity"]) for i in order["items"]) == [(1, 3), (4, 1)]


def test_order_numbers_are_unique(env):
    numbers = {env.client.post("/api/orders", json=body()).json()["order_number"] for _ in range(15)}
    assert len(numbers) == 15


def test_a_later_price_change_does_not_change_an_existing_order(env):
    order = env.client.post("/api/orders", json=body()).json()
    with env.Session() as db:
        db.execute(update(products).where(products.c.id == 1).values(price="999.00"))
        db.commit()
    again = env.client.get(f"/api/account/orders/{order['id']}").json()
    assert float(again["items"][0]["unit_price"]) == 499.0 and float(again["total_amount"]) == 1048.0


# ------------------------------------------------------------------ the browser cannot set prices

@pytest.mark.parametrize("extra", [{"total_amount": 1}, {"subtotal": 1}, {"shipping_cost": 0},
                                   {"discount_amount": 500}, {"user_id": 2}, {"status": "DELIVERED"}])
def test_extra_fields_such_as_totals_are_rejected(env, extra):
    assert env.client.post("/api/orders", json=body(**extra)).status_code == 422
    assert order_count(env) == 0


def test_a_price_on_an_item_is_rejected(env):
    items = [{"product_id": 1, "quantity": 1, "unit_price": 0.01}]
    assert env.client.post("/api/orders", json=body(items=items)).status_code == 422
    assert order_count(env) == 0


# ------------------------------------------------------------------ invalid requests create nothing

@pytest.mark.parametrize("override", [
    {"items": [{"product_id": 2, "quantity": 1}]},                               # inactive product
    {"items": [{"product_id": 999, "quantity": 1}]},                             # unknown product
    {"items": [{"product_id": 4, "variant_id": 1, "quantity": 1}]},              # variant of another product
    {"items": [{"product_id": 3, "variant_id": 999, "quantity": 1}]},            # unknown variant
    {"items": [{"product_id": 3, "quantity": 1}]},                               # variant required but missing
    {"address_id": 2},                                                           # someone else's address
    {"address_id": 999},                                                         # unknown address
    {"shipping_method_id": 3},                                                   # switched off
    {"shipping_method_id": 999},                                                 # unknown
])
def test_unavailable_things_are_refused_with_422_and_nothing_is_created(env, override):
    r = env.client.post("/api/orders", json=body(**override))
    assert r.status_code == 422, r.text
    assert order_count(env) == 0


def test_someone_elses_address_looks_the_same_as_a_missing_one(env):
    theirs = env.client.post("/api/orders", json=body(address_id=2)).json()["detail"]
    missing = env.client.post("/api/orders", json=body(address_id=999)).json()["detail"]
    assert theirs.replace("2", "N") == missing.replace("999", "N")


@pytest.mark.parametrize("override", [
    {"payment_method": "CHEQUE"}, {"payment_method": "cod"}, {"items": []},
    {"items": [{"product_id": 1, "quantity": 0}]}, {"items": [{"product_id": 1, "quantity": -1}]},
    {"items": [{"product_id": 1, "quantity": 101}]}, {"items": [{"product_id": 1}]},
    {"items": [{"product_id": 1, "quantity": 1}] * 51},
])
def test_malformed_requests_are_refused(env, override):
    assert env.client.post("/api/orders", json=body(**override)).status_code == 422
    assert order_count(env) == 0


def test_missing_fields_are_refused(env):
    assert env.client.post("/api/orders", json={}).status_code == 422
    assert env.client.post("/api/orders", json={"items": [{"product_id": 1, "quantity": 1}]}).status_code == 422


# ------------------------------------------------------------------ roles and failures

def test_a_login_is_required(env):
    env.app.dependency_overrides.pop(get_current_user)
    assert env.client.post("/api/orders", json=body()).status_code == 401


def test_admins_cannot_place_orders(env):
    env.who["user"] = ADMIN
    assert env.client.post("/api/orders", json=body()).status_code == 403
    assert order_count(env) == 0


def test_out_of_stock_from_the_inventory_hook_creates_nothing(env):
    def deduct(db, order, previous, new):
        if new == "CONFIRMED":
            raise OutOfStock("Only 1 left of product 1")

    register_status_hook(deduct)
    r = env.client.post("/api/orders", json=body())
    assert r.status_code == 409 and "Only 1 left" in r.json()["detail"]
    assert order_count(env) == 0
    with env.Session() as db:
        assert db.query(OrderItem).count() == 0 and db.query(OrderStatusHistory).count() == 0


def test_an_online_order_does_not_touch_stock_until_it_is_paid(env):
    deducted = []
    register_status_hook(lambda db, order, previous, new: deducted.append(new) if new == "CONFIRMED" else None)
    order = env.client.post("/api/orders", json=body(payment_method="ONLINE")).json()
    assert deducted == []
    with env.Session() as db:
        apply_payment_result(db, db.get(Order, order["id"]), "SUCCESS")
        db.commit()
    assert deducted == ["CONFIRMED"]


def test_the_order_appears_in_my_orders(env):
    created = env.client.post("/api/orders", json=body()).json()
    listed = env.client.get("/api/account/orders").json()
    assert [o["id"] for o in listed] == [created["id"]]
