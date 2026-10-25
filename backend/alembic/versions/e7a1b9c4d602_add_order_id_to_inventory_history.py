
"""Add order_id to inventory history."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7a1b9c4d602"
down_revision: Union[str, Sequence[str], None] = "d4e8a2c91f60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "inventory_history",
        sa.Column("order_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_inventory_history_order_id",
        "inventory_history",
        ["order_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_inventory_history_order_id",
        table_name="inventory_history",
    )
    op.drop_column("inventory_history", "order_id")
