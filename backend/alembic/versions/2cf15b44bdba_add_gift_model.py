"""Add gift model

Revision ID: 2cf15b44bdba
Revises: 7a716ff5fb57
Create Date: 2026-04-03 23:31:31.844883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2cf15b44bdba'
down_revision: Union[str, None] = '7a716ff5fb57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('gifts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('buyer_name', sa.String(), nullable=True),
    sa.Column('buyer_email', sa.String(), nullable=True),
    sa.Column('tree_id', sa.Integer(), nullable=True),
    sa.Column('quantity', sa.Integer(), nullable=True),
    sa.Column('recipient_name', sa.String(), nullable=True),
    sa.Column('recipient_last_name', sa.String(), nullable=True),
    sa.Column('recipient_email', sa.String(), nullable=True),
    sa.Column('recipient_whatsapp', sa.String(), nullable=True),
    sa.Column('recipient_address', sa.String(), nullable=True),
    sa.Column('message', sa.String(), nullable=True),
    sa.Column('send_date', sa.Date(), nullable=True),
    sa.Column('transaction_ref', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('certificate_url', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['tree_id'], ['tree_species.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_gifts_id'), 'gifts', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_gifts_id'), table_name='gifts')
    op.drop_table('gifts')
