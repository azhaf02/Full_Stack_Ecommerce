"""create cart and coupon tables

Revision ID: 0004_cart_coupons
Revises: 0001_notif_reviews
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_cart_coupons"
down_revision: Union[str, None] = "0001_notif_reviews"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_carts_id",
        "carts",
        ["id"],
        unique=False,
    )

    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cart_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(
            ["cart_id"],
            ["carts.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_cart_items_id",
        "cart_items",
        ["id"],
        unique=False,
    )

    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("discount_type", sa.String(length=20), nullable=False),
        sa.Column("discount_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("min_order_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("max_discount", sa.Numeric(10, 2), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("expiry_date", sa.DateTime(), nullable=False),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("per_user_limit", sa.Integer(), nullable=True),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_index(
        "ix_coupons_id",
        "coupons",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_coupons_code",
        "coupons",
        ["code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_coupons_code", table_name="coupons")
    op.drop_index("ix_coupons_id", table_name="coupons")
    op.drop_table("coupons")

    op.drop_index("ix_cart_items_id", table_name="cart_items")
    op.drop_table("cart_items")

    op.drop_index("ix_carts_id", table_name="carts")
    op.drop_table("carts")