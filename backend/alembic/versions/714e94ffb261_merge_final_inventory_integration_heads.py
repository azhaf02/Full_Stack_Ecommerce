"""merge final inventory integration heads

Revision ID: 714e94ffb261
Revises: 37cbcd26f31f, c3f8a1d9b762
Create Date: 2026-11-04 17:53:08.305273

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '714e94ffb261'
down_revision: Union[str, Sequence[str], None] = ('37cbcd26f31f', 'c3f8a1d9b762')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
