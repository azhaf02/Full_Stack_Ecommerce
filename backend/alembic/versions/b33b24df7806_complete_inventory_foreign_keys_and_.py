"""complete inventory foreign keys and history fields

Revision ID: b33b24df7806
Revises: 40775ba06905
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b33b24df7806"
down_revision: Union[str, Sequence[str], None] = "40775ba06905"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Inventory -> Product
    op.create_foreign_key(
        "inventory_product_id_fkey",
        "inventory",
        "products",
        ["product_id"],
        ["id"],
    )

    # Inventory -> Product Variant
    op.create_foreign_key(
        "inventory_variant_id_fkey",
        "inventory",
        "product_variants",
        ["variant_id"],
        ["id"],
    )

    # Required Inventory History fields
    op.add_column(
        "inventory_history",
        sa.Column("product_id", sa.Integer(), nullable=True),
    )

    op.add_column(
        "inventory_history",
        sa.Column("change_amount", sa.Integer(), nullable=True),
    )

    op.add_column(
        "inventory_history",
        sa.Column("changed_by", sa.Integer(), nullable=True),
    )

    op.add_column(
        "inventory_history",
        sa.Column(
            "timestamp",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )

    # Link history records to Product
    op.create_foreign_key(
        "inventory_history_product_id_fkey",
        "inventory_history",
        "products",
        ["product_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "inventory_history_product_id_fkey",
        "inventory_history",
        type_="foreignkey",
    )

    op.drop_column("inventory_history", "timestamp")
    op.drop_column("inventory_history", "changed_by")
    op.drop_column("inventory_history", "change_amount")
    op.drop_column("inventory_history", "product_id")

    op.drop_constraint(
        "inventory_variant_id_fkey",
        "inventory",
        type_="foreignkey",
    )

    op.drop_constraint(
        "inventory_product_id_fkey",
        "inventory",
        type_="foreignkey",
    )