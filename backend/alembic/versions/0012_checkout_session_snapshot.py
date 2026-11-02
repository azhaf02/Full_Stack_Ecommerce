"""Add checkout review snapshot to checkout sessions."""

from alembic import op
import sqlalchemy as sa

revision = "0012_checkout_session_snapshot"
down_revision = "0011_merge_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "checkout_sessions",
        sa.Column("checkout_snapshot", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("checkout_sessions", "checkout_snapshot")