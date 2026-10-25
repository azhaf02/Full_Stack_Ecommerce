"""Merge the inventory/catalog migration history with main heads.

This is a no-op merge revision. It does not create, alter, or drop tables.
"""

from typing import Sequence, Union

revision: str = "c91f6a2e7d14"
down_revision: Union[str, Sequence[str], None] = (
    "0011_merge_heads",
    "b33b24df7806",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
