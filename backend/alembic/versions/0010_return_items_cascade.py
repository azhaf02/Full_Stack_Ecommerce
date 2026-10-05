"""cascade return_items when an order item is deleted

Without this, an order (or order item) that has a return could not be deleted, because return_items
still referenced the order item. Return lines now go away with their order item.

Revision ID: 0010_return_items_cascade
Revises: 0009_returns
Create Date: 2026-10-02 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = '0010_return_items_cascade'
down_revision: Union[str, None] = '0009_returns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FK_NAME = 'return_items_order_item_id_fkey'

def upgrade() -> None:
    op.drop_constraint(FK_NAME, 'return_items', type_='foreignkey')
    op.create_foreign_key(FK_NAME, 'return_items', 'order_items', ['order_item_id'], ['id'], ondelete='CASCADE')

def downgrade() -> None:
    op.drop_constraint(FK_NAME, 'return_items', type_='foreignkey')
    op.create_foreign_key(FK_NAME, 'return_items', 'order_items', ['order_item_id'], ['id'])
