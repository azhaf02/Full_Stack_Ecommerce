"""merge inventory audit and integration heads

Revision ID: 5ce77c51f692
Revises: 1b0ce0d5536d, b71c4e9f2a06
Create Date: 2026-10-31 18:12:15.884315

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ce77c51f692'
down_revision: Union[str, Sequence[str], None] = ('1b0ce0d5536d', 'b71c4e9f2a06')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
