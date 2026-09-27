"""add_is_native_to_tree_species

Revision ID: b3c1d2e4f5a6
Revises: 98923f5789d2
Create Date: 2026-09-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c1d2e4f5a6'
down_revision: Union[str, None] = '98923f5789d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Todas las especies empiezan sin marcar hasta que el ingeniero forestal confirme cuáles son nativas
    op.add_column('tree_species', sa.Column('is_native', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('tree_species', 'is_native')
