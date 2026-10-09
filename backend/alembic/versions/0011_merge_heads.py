"""merge the three migration heads on main into one

main had three heads because three modules branched off in parallel:
  0001_users_roles_addresses      authentication (Madeeha)
  0010_return_items_cascade       orders and returns (Rukhsar), chained after payments
  bd80f21972e0                    inventory (Rehan), chained after payments

This migration changes nothing in the database; it only joins them so that `alembic upgrade head` has a
single target again.

Branches that are still open (catalog f5ce733f01f2, variants 2a1d2ae4541d, support 0010, shipping methods)
will add their own heads when they merge. Whoever merges them should add another merge migration like this
one, with `down_revision` listing every current head (see `python -m alembic heads`).

Revision ID: 0011_merge_heads
Revises: 0001_users_roles_addresses, 0010_return_items_cascade, bd80f21972e0
Create Date: 2026-10-07 12:00:00.000000

"""
from typing import Sequence, Union

revision: str = '0011_merge_heads'
down_revision: Union[str, Sequence[str], None] = (
    '0001_users_roles_addresses',
    '0010_return_items_cascade',
    'bd80f21972e0',
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
