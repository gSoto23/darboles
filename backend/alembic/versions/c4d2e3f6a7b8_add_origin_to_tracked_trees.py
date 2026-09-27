"""add_origin_to_tracked_trees

Revision ID: c4d2e3f6a7b8
Revises: b3c1d2e4f5a6
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d2e3f6a7b8'
down_revision: Union[str, None] = 'b3c1d2e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tracked_trees', sa.Column('origin', sa.String(), server_default='guardian', nullable=False))
    op.add_column('tracked_trees', sa.Column('project_name', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('tracked_trees', 'project_name')
    op.drop_column('tracked_trees', 'origin')
