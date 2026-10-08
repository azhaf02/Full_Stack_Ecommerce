"""create support tables

Revision ID: 0010
Revises: 
Create Date: 2026-09-30 23:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0010'
down_revision = '0008_order_payment_method'

branch_labels = None
depends_on = None

def upgrade():
    # support_tickets table blueprint
    op.create_table(
        'support_tickets',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('customer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Open', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    
    
    op.create_table(
        'support_messages',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('support_tickets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_type', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False)
    )

def downgrade():
    op.drop_table('support_messages')
    op.drop_table('support_tickets')
