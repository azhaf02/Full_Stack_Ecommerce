"""merge catalog migration with integration heads

Revision ID: 80ec98f4c90a
Revises: 0011_merge_heads, f5ce733f01f2
Create Date: 2026-10-08 19:22:39.235993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80ec98f4c90a'
down_revision: Union[str, Sequence[str], None] = ('0011_merge_heads', 'f5ce733f01f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
