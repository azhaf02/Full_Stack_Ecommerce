"""Prevent duplicate inventory rows for products and variants."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a8b2c9d1e604"
down_revision: Union[str, Sequence[str], None] = "e7a1b9c4d602"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    duplicate_groups = bind.execute(sa.text("""
        SELECT COUNT(*)
        FROM (
            SELECT product_id, variant_id
            FROM inventory
            GROUP BY product_id, variant_id
            HAVING COUNT(*) > 1
        ) AS duplicate_groups
    """)).scalar_one()

    if duplicate_groups:
        raise RuntimeError(
            "Duplicate inventory records exist. Reconcile and back up the "
            "records before applying inventory uniqueness indexes."
        )

    op.create_index(
        "uq_inventory_product_variant",
        "inventory",
        ["product_id", "variant_id"],
        unique=True,
        postgresql_where=sa.text("variant_id IS NOT NULL"),
        sqlite_where=sa.text("variant_id IS NOT NULL"),
    )
    op.create_index(
        "uq_inventory_product_without_variant",
        "inventory",
        ["product_id"],
        unique=True,
        postgresql_where=sa.text("variant_id IS NULL"),
        sqlite_where=sa.text("variant_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_inventory_product_without_variant",
        table_name="inventory",
    )
    op.drop_index(
        "uq_inventory_product_variant",
        table_name="inventory",
    )
