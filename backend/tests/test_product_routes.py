
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from app.models.user import User
from app.models.role import Role
from app.models.address import Address
from app.models.category import Category
from app.models.product_image import ProductImage
from app.api.routes.product import get_product_detail, list_products
from app.api.routes.variant import get_product_variants


def test_product_detail_returns_404_when_missing():
    db = MagicMock()
    db.query.return_value.options.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc:
        get_product_detail(product_id=999999, db=db)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Product not found"


def test_variants_returns_404_when_product_missing():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc:
        get_product_variants(product_id=999999, db=db)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Product not found"


def test_product_list_rejects_minimum_price_above_maximum():
    db = MagicMock()

    with pytest.raises(HTTPException) as exc:
        list_products(min_price=100, max_price=50, db=db)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Minimum price cannot exceed maximum price"


def test_variant_stock_comes_from_inventory():
    db = MagicMock()

    product_query = MagicMock()
    product_query.filter.return_value.first.return_value = SimpleNamespace(id=2)

    variant = SimpleNamespace(
        id=10,
        product_id=2,
        attribute_name="Size",
        attribute_value="Large",
        price_delta=Decimal("5.00"),
    )
    variant_query = MagicMock()
    variant_query.filter.return_value.all.return_value = [variant]

    db.query.side_effect = [product_query, variant_query]
    db.execute.return_value.fetchone.return_value = (7,)

    result = get_product_variants(product_id=2, db=db)

    assert len(result) == 1
    assert result[0]["id"] == 10
    assert result[0]["stock"] == 7
    db.execute.assert_called_once()
