"""add payment_method to orders and constrain payment_status

COD and online payments need different handling when an order is confirmed, so the order records which
method was chosen. payment_status is limited to the six statuses in the Payment-Order-Inventory
integration guide.

Revision ID: 0008_order_payment_method
Revises: 0007_orders
Create Date: 2026-10-01 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0008_order_payment_method'
down_revision: Union[str, None] = '0007_orders'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PAYMENT_STATUSES = ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED')

def upgrade() -> None:
    # The server default only backfills any rows that already exist; it is removed straight after, so
    # new orders must state their payment method explicitly.
    op.add_column('orders', sa.Column('payment_method', sa.String(length=20), nullable=False, server_default='ONLINE'))
    op.alter_column('orders', 'payment_method', server_default=None)

    status_list = ", ".join(f"'{s}'" for s in PAYMENT_STATUSES)
    op.create_check_constraint('check_order_payment_status_valid', 'orders', f'payment_status IN ({status_list})')

def downgrade() -> None:
    op.drop_constraint('check_order_payment_status_valid', 'orders', type_='check')
    op.drop_column('orders', 'payment_method')
