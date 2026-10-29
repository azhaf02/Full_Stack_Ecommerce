"""create payments and invoices

Revision ID: 0d01fe9783e7
Revises: 0008_order_payment_method
Create Date: 2026-10-01 21:35:17.683418

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d01fe9783e7'
down_revision: Union[str, Sequence[str], None] = '0008_order_payment_method'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create payments and invoices tables."""

    payment_method_enum = sa.Enum(
        'ONLINE',
        'COD',
        name='paymentmethod'
    )

    payment_status_enum = sa.Enum(
        'PENDING',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'REFUND_PENDING',
        'REFUNDED',
        name='paymentstatus'
    )

    # Create payments table
    op.create_table(
        'payments',

        sa.Column(
            'id',
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),

        sa.Column(
            'order_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'method',
            payment_method_enum,
            nullable=False
        ),

        sa.Column(
            'status',
            payment_status_enum,
            nullable=False
        ),

        sa.Column(
            'transaction_id',
            sa.String(length=100),
            nullable=True,
            unique=True
        ),

        sa.Column(
            'amount',
            sa.Numeric(10, 2),
            nullable=False
        ),

        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False
        ),

        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ['order_id'],
            ['orders.id'],
            ondelete='CASCADE'
        )
    )

    op.create_index(
        'ix_payments_order_id',
        'payments',
        ['order_id'],
        unique=False
    )

    op.create_index(
        'ix_payments_transaction_id',
        'payments',
        ['transaction_id'],
        unique=True
    )

    # Create invoices table
    op.create_table(
        'invoices',

        sa.Column(
            'id',
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),

        sa.Column(
            'order_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'invoice_number',
            sa.String(length=100),
            nullable=False,
            unique=True
        ),

        sa.Column(
            'amount',
            sa.Numeric(10, 2),
            nullable=False
        ),

        sa.Column(
            'tax',
            sa.Numeric(10, 2),
            nullable=False
        ),

        sa.Column(
            'issued_at',
            sa.DateTime(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ['order_id'],
            ['orders.id'],
            ondelete='CASCADE'
        )
    )

    op.create_index(
        'ix_invoices_order_id',
        'invoices',
        ['order_id'],
        unique=False
    )

    op.create_index(
        'ix_invoices_invoice_number',
        'invoices',
        ['invoice_number'],
        unique=True
    )


def downgrade() -> None:
    """Remove payments and invoices tables."""

    op.drop_index(
        'ix_invoices_invoice_number',
        table_name='invoices'
    )

    op.drop_index(
        'ix_invoices_order_id',
        table_name='invoices'
    )

    op.drop_table('invoices')

    op.drop_index(
        'ix_payments_transaction_id',
        table_name='payments'
    )

    op.drop_index(
        'ix_payments_order_id',
        table_name='payments'
    )

    op.drop_table('payments')

    sa.Enum(
        name='paymentstatus'
    ).drop(
        op.get_bind(),
        checkfirst=True
    )

    sa.Enum(
        name='paymentmethod'
    ).drop(
        op.get_bind(),
        checkfirst=True
    )