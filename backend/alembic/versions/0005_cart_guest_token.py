"""Add guest-token persistence to carts.

Revision ID: 0005_cart_guest_token
Revises: 0004_cart_coupons
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_cart_guest_token"
down_revision: Union[str, None] = "0004_cart_coupons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Forward-only, non-destructive schema correction: preserve all existing carts.
    op.add_column("carts", sa.Column("guest_token", sa.String(length=64), nullable=True))
    op.create_index("ix_carts_guest_token", "carts", ["guest_token"], unique=True)


def downgrade() -> None:
    # This migration is reversible, but do not run downgrade on a shared database
    # without an explicit migration rollback plan.
    op.drop_index("ix_carts_guest_token", table_name="carts")
    op.drop_column("carts", "guest_token")
