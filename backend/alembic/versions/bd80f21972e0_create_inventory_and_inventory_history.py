"""create inventory and inventory history

Revision ID: bd80f21972e0
Revises: 0d01fe9783e7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bd80f21972e0"
down_revision: Union[str, Sequence[str], None] = "0d01fe9783e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "low_stock_threshold",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="IN_STOCK",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "quantity >= 0",
            name="check_inventory_quantity_non_negative",
        ),
        sa.CheckConstraint(
            "low_stock_threshold >= 0",
            name="check_inventory_threshold_non_negative",
        ),
        sa.CheckConstraint(
            "status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')",
            name="check_inventory_status_valid",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_inventory_id",
        "inventory",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_product_id",
        "inventory",
        ["product_id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_variant_id",
        "inventory",
        ["variant_id"],
        unique=False,
    )

    op.create_table(
        "inventory_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("inventory_id", sa.Integer(), nullable=False),
        sa.Column("change_type", sa.String(length=30), nullable=False),
        sa.Column("quantity_changed", sa.Integer(), nullable=False),
        sa.Column("previous_quantity", sa.Integer(), nullable=False),
        sa.Column("new_quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["inventory_id"],
            ["inventory.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_inventory_history_id",
        "inventory_history",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_history_inventory_id",
        "inventory_history",
        ["inventory_id"],
        unique=False,
    )


def downgrade() -> None:

    op.drop_index(
        "ix_inventory_history_inventory_id",
        table_name="inventory_history",
    )

    op.drop_index(
        "ix_inventory_history_id",
        table_name="inventory_history",
    )

    op.drop_table("inventory_history")

    op.drop_index(
        "ix_inventory_variant_id",
        table_name="inventory",
    )

    op.drop_index(
        "ix_inventory_product_id",
        table_name="inventory",
    )

    op.drop_index(
        "ix_inventory_id",
        table_name="inventory",
    )

    op.drop_table("inventory")