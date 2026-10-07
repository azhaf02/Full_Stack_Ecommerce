"""create orders, order_items and order_status_history tables

user_id, address_id, coupon_id, product_id and variant_id have no FK constraints yet because the
users/addresses/coupons/products/product_variants tables don't exist; add them in a follow-up migration.

Revision ID: 0007_orders
Revises: 6658707a12a7
Create Date: 2026-10-01 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0007_orders'
down_revision: Union[str, None] = '6658707a12a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ORDER_STATUSES = (
    'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    'CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED',
)

def upgrade() -> None:
    status_list = ", ".join(f"'{s}'" for s in ORDER_STATUSES)

    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_number', sa.String(length=30), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('address_id', sa.Integer(), nullable=False),
        sa.Column('shipping_method_id', sa.Integer(), nullable=False),
        sa.Column('coupon_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='PLACED'),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('tax_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('shipping_cost', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(f'status IN ({status_list})', name='check_order_status_valid'),
        sa.CheckConstraint('total_amount >= 0', name='check_order_total_non_negative'),
        sa.ForeignKeyConstraint(['shipping_method_id'], ['shipping_methods.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)
    op.create_index(op.f('ix_orders_user_id'), 'orders', ['user_id'], unique=False)
    op.create_index(op.f('ix_orders_status'), 'orders', ['status'], unique=False)

    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('variant_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.CheckConstraint('quantity > 0', name='check_order_item_quantity_positive'),
        sa.CheckConstraint('unit_price >= 0', name='check_order_item_price_non_negative'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_order_items_id'), 'order_items', ['id'], unique=False)
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)

    op.create_table(
        'order_status_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('previous_status', sa.String(length=30), nullable=True),
        sa.Column('new_status', sa.String(length=30), nullable=False),
        sa.Column('changed_by', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_order_status_history_id'), 'order_status_history', ['id'], unique=False)
    op.create_index(op.f('ix_order_status_history_order_id'), 'order_status_history', ['order_id'], unique=False)

def downgrade() -> None:
    op.drop_table('order_status_history')
    op.drop_table('order_items')
    op.drop_table('orders')
