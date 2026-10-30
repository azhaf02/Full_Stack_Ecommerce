"""merge_multiple_heads

Revision ID: 941b17e65ac9
Revises: 0001_users_roles_addresses, 0010_return_items_cascade, 0010, bd80f21972e0
Create Date: 2026-10-22 18:57:25.446721

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '941b17e65ac9'
down_revision: Union[str, Sequence[str], None] = ('0001_users_roles_addresses', '0010_return_items_cascade', '0010', 'bd80f21972e0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
