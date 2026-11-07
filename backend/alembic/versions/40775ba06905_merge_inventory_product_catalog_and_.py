
"""Merge inventory, product catalog, and returns migrations.

Revision ID: 40775ba06905
Revises: 0010_return_items_cascade, bd80f21972e0, f5ce733f01f2
Create Date: 2026-10-04 13:38:07.871546
"""

from typing import Sequence, Union


# Revision identifiers, used by Alembic.
revision: str = "40775ba06905"

down_revision: Union[str, Sequence[str], None] = (
    "0010_return_items_cascade",
    "bd80f21972e0",
    "f5ce733f01f2",
)

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration branches without schema changes."""
    pass


def downgrade() -> None:
    """Downgrade merge revision without schema changes."""
    pass
