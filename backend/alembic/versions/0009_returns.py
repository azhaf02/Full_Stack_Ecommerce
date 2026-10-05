"""create returns and return_items tables

A return belongs to an order and records the customer's reason, the admin's decision and the refund.
return_items lists which order items (and how many) are being returned, so partial returns work.
user_id has no FK constraint yet because the users table doesn't exist.

Chains after Aaliya's payments/invoices migration (0d01fe9783e7), which is already applied to the shared
database, so her feature/payment branch must be merged before this one.

Revision ID: 0009_returns
Revises: 0d01fe9783e7
Create Date: 2026-10-02 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0009_returns'
down_revision: Union[str, None] = '0d01fe9783e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RETURN_STATUSES = ('REQUESTED', 'APPROVED', 'REJECTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED')

def upgrade() -> None:
    status_list = ", ".join(f"'{s}'" for s in RETURN_STATUSES)

    op.create_table(
        'returns',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='REQUESTED'),
        sa.Column('admin_remarks', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('refund_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(f'status IN ({status_list})', name='check_return_status_valid'),
        sa.CheckConstraint('refund_amount IS NULL OR refund_amount >= 0', name='check_return_refund_non_negative'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_returns_id'), 'returns', ['id'], unique=False)
    op.create_index(op.f('ix_returns_order_id'), 'returns', ['order_id'], unique=False)
    op.create_index(op.f('ix_returns_user_id'), 'returns', ['user_id'], unique=False)
    op.create_index(op.f('ix_returns_status'), 'returns', ['status'], unique=False)

    op.create_table(
        'return_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('return_id', sa.Integer(), nullable=False),
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.CheckConstraint('quantity > 0', name='check_return_item_quantity_positive'),
        sa.ForeignKeyConstraint(['return_id'], ['returns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('return_id', 'order_item_id', name='uq_return_item_per_return'),
    )
    op.create_index(op.f('ix_return_items_id'), 'return_items', ['id'], unique=False)
    op.create_index(op.f('ix_return_items_return_id'), 'return_items', ['return_id'], unique=False)
    op.create_index(op.f('ix_return_items_order_item_id'), 'return_items', ['order_item_id'], unique=False)

def downgrade() -> None:
    op.drop_table('return_items')
    op.drop_table('returns')
