"""baseline of the shared database before migrations were tracked in the repo

The shared Supabase database is already stamped at this revision, but the original revision file was never
committed. This no-op placeholder lets Alembic resolve the chain. At this point the database contains
shipping_methods, notifications and reviews.

Revision ID: 6658707a12a7
Revises:
Create Date: 2026-10-01 00:00:00.000000

"""
from typing import Sequence, Union

revision: str = '6658707a12a7'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
