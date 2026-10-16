"""add_card_payments

Cobros con tarjeta en Tilopay, para verificar el OrderHash del retorno.

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-10-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'card_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('txn_ref', sa.String(length=40), nullable=False),
        sa.Column('amount_crc', sa.Float(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('tilopay_order_id', sa.String(length=64), nullable=True),
        sa.Column('auth_code', sa.String(length=64), nullable=True),
        sa.Column('response_code', sa.String(length=10), nullable=True),
        sa.Column('response_description', sa.String(length=255), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('auth_code', name='uq_card_payments_auth_code'),
    )
    op.create_index('ix_card_payments_id', 'card_payments', ['id'])
    op.create_index('ix_card_payments_txn_ref', 'card_payments', ['txn_ref'], unique=True)
    op.create_index('ix_card_payments_status', 'card_payments', ['status'])


def downgrade() -> None:
    op.drop_index('ix_card_payments_status', table_name='card_payments')
    op.drop_index('ix_card_payments_txn_ref', table_name='card_payments')
    op.drop_index('ix_card_payments_id', table_name='card_payments')
    op.drop_table('card_payments')
