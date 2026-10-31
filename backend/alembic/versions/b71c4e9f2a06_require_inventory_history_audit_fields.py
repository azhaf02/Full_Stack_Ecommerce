"""Require core inventory history audit fields."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b71c4e9f2a06"
down_revision: Union[str, Sequence[str], None] = "a8b2c9d1e604"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    missing_count = bind.execute(sa.text("""
        SELECT COUNT(*)
        FROM inventory_history
        WHERE product_id IS NULL
           OR change_amount IS NULL
           OR changed_by IS NULL
           OR timestamp IS NULL
    """)).scalar_one()

    if missing_count:
        raise RuntimeError(
            f"Cannot enforce required inventory history fields: "
            f"{missing_count} rows contain NULL values."
        )

    op.alter_column(
        "inventory_history", "product_id",
        existing_type=sa.Integer(),
        existing_nullable=True,
        nullable=False,
    )
    op.alter_column(
        "inventory_history", "change_amount",
        existing_type=sa.Integer(),
        existing_nullable=True,
        nullable=False,
    )
    op.alter_column(
        "inventory_history", "changed_by",
        existing_type=sa.Integer(),
        existing_nullable=True,
        nullable=False,
    )
    op.alter_column(
        "inventory_history", "timestamp",
        existing_type=sa.DateTime(),
        existing_nullable=True,
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "inventory_history", "timestamp",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        nullable=True,
    )
    op.alter_column(
        "inventory_history", "changed_by",
        existing_type=sa.Integer(),
        existing_nullable=False,
        nullable=True,
    )
    op.alter_column(
        "inventory_history", "change_amount",
        existing_type=sa.Integer(),
        existing_nullable=False,
        nullable=True,
    )
    op.alter_column(
        "inventory_history", "product_id",
        existing_type=sa.Integer(),
        existing_nullable=False,
        nullable=True,
    )
