
"""create shipping methods

Revision ID: 6658707a12a7
Revises:
Create Date: 2026-09-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6658707a12a7"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the shipping_methods table."""
    op.create_table(
        "shipping_methods",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("cost", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("estimated_days", sa.Integer(), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "cost >= 0",
            name="check_shipping_cost_nonnegative",
        ),
        sa.CheckConstraint(
            "estimated_days >= 0",
            name="check_shipping_estimated_days_nonnegative",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(
        op.f("ix_shipping_methods_id"),
        "shipping_methods",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop the shipping_methods table."""
    op.drop_index(
        op.f("ix_shipping_methods_id"),
        table_name="shipping_methods",
    )
    op.drop_table("shipping_methods")