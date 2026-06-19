"""Add certificate_sent_at to gifts

Revision ID: 98923f5789d2
Revises: fa1234567890
Create Date: 2026-06-18 23:16:37.296136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98923f5789d2'
down_revision: Union[str, None] = 'fa1234567890'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('gifts', sa.Column('certificate_sent_at', sa.DateTime(), nullable=True))

def downgrade() -> None:
    op.drop_column('gifts', 'certificate_sent_at')
