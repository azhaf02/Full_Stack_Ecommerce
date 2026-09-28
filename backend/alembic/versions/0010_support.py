"""add support ticket schema

Revision ID: 0010_support
Revises: 0009_order
"""
from alembic import op
import sqlalchemy as sa

revision = '0010_support'
down_revision = '0009_order'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'support_tickets',
        sa.Column('id', sa.Integer(), primary key=True),
        sa.Column('customer_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Open')
    )

def downgrade():
    op.drop_table('support_tickets')
