"""merge all integration and cart migration heads

Revision ID: 1b0ce0d5536d
Revises: 80ec98f4c90a, 941b17e65ac9, merge_cart_inventory_heads
Create Date: 2026-10-30 14:07:56.547126

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '1b0ce0d5536d'
down_revision: Union[str, Sequence[str], None] = ('80ec98f4c90a', '941b17e65ac9', 'merge_cart_inventory_heads')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
