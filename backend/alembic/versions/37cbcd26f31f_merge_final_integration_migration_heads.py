"""merge final integration migration heads

Revision ID: 37cbcd26f31f
Revises: 1b0ce0d5536d, e7a1b9c4d602
Create Date: 2026-10-31 12:29:47.357350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37cbcd26f31f'
down_revision: Union[str, Sequence[str], None] = ('1b0ce0d5536d', 'e7a1b9c4d602')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
