"""add product variants and wishlists

Revision ID: 2a1d2ae4541d
Revises: f5ce733f01f2
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2a1d2ae4541d"
down_revision: Union[str, Sequence[str], None] = "f5ce733f01f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create product variants and wishlist tables."""

    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("attribute_name", sa.String(length=50), nullable=False),
        sa.Column("attribute_value", sa.String(length=100), nullable=False),
        sa.Column("price_delta", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "product_id",
            "attribute_name",
            "attribute_value",
            name="uq_product_variant_attribute",
        ),
    )

    op.create_index(
        "ix_product_variants_id",
        "product_variants",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_product_variants_product_id",
        "product_variants",
        ["product_id"],
        unique=False,
    )

    op.create_table(
        "wishlists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_wishlists_id",
        "wishlists",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_wishlists_user_id",
        "wishlists",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("wishlist_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["wishlist_id"],
            ["wishlists.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "wishlist_id",
            "product_id",
            name="uq_wishlist_product",
        ),
    )

    op.create_index(
        "ix_wishlist_items_id",
        "wishlist_items",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_wishlist_items_wishlist_id",
        "wishlist_items",
        ["wishlist_id"],
        unique=False,
    )

    op.create_index(
        "ix_wishlist_items_product_id",
        "wishlist_items",
        ["product_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop product variants and wishlist tables."""

    op.drop_index(
        "ix_wishlist_items_product_id",
        table_name="wishlist_items",
    )
    op.drop_index(
        "ix_wishlist_items_wishlist_id",
        table_name="wishlist_items",
    )
    op.drop_index(
        "ix_wishlist_items_id",
        table_name="wishlist_items",
    )
    op.drop_table("wishlist_items")

    op.drop_index(
        "ix_wishlists_user_id",
        table_name="wishlists",
    )
    op.drop_index(
        "ix_wishlists_id",
        table_name="wishlists",
    )
    op.drop_table("wishlists")

    op.drop_index(
        "ix_product_variants_product_id",
        table_name="product_variants",
    )
    op.drop_index(
        "ix_product_variants_id",
        table_name="product_variants",
    )
    op.drop_table("product_variants")