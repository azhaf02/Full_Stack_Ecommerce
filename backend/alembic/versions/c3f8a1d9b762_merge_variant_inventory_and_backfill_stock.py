"""Merge inventory and variant heads and backfill missing stock rows.

Existing inventory records and their quantities are preserved.
"""

from alembic import context, op
import sqlalchemy as sa


revision = "c3f8a1d9b762"
down_revision = ("2a1d2ae4541d", "5ce77c51f692")
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not context.is_offline_mode():
        bind = op.get_bind()

        negative_products = bind.execute(sa.text("""
            SELECT COUNT(*)
            FROM products
            WHERE stock_quantity < 0
        """)).scalar_one()

        negative_variants = bind.execute(sa.text("""
            SELECT COUNT(*)
            FROM product_variants
            WHERE stock < 0
        """)).scalar_one()

        if negative_products or negative_variants:
            raise RuntimeError(
                "Inventory backfill stopped: negative legacy stock values exist. "
                "Reconcile those records before applying this migration."
            )

    bind = op.get_bind()

    # Add default product inventory only when its matching row is absent.
    bind.execute(sa.text("""
        INSERT INTO inventory (
            product_id,
            variant_id,
            quantity,
            low_stock_threshold,
            status
        )
        SELECT
            p.id,
            NULL,
            p.stock_quantity,
            10,
            CASE
                WHEN p.stock_quantity <= 0 THEN 'OUT_OF_STOCK'
                WHEN p.stock_quantity <= 10 THEN 'LOW_STOCK'
                ELSE 'IN_STOCK'
            END
        FROM products AS p
        WHERE NOT EXISTS (
            SELECT 1
            FROM inventory AS i
            WHERE i.product_id = p.id
              AND i.variant_id IS NULL
        )
    """))

    # Add variant inventory only when its matching row is absent.
    bind.execute(sa.text("""
        INSERT INTO inventory (
            product_id,
            variant_id,
            quantity,
            low_stock_threshold,
            status
        )
        SELECT
            v.product_id,
            v.id,
            v.stock,
            10,
            CASE
                WHEN v.stock <= 0 THEN 'OUT_OF_STOCK'
                WHEN v.stock <= 10 THEN 'LOW_STOCK'
                ELSE 'IN_STOCK'
            END
        FROM product_variants AS v
        WHERE NOT EXISTS (
            SELECT 1
            FROM inventory AS i
            WHERE i.product_id = v.product_id
              AND i.variant_id = v.id
        )
    """))


def downgrade() -> None:
    # Do not delete inventory data during downgrade.
    pass
