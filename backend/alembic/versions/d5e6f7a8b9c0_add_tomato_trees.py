"""add_tomato_trees

Árboles de proyectos de TOMATO sincronizados desde tomatocr.com.

Revision ID: d5e6f7a8b9c0
Revises: c4d2e3f6a7b8
Create Date: 2026-09-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c4d2e3f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tomato_trees',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('project_name', sa.String(length=255), nullable=False),
        sa.Column('project_public', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('tree_number', sa.Integer(), nullable=True),
        sa.Column('species', sa.String(length=255), nullable=True),
        sa.Column('sector', sa.String(length=255), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('location_precision', sa.String(length=10), nullable=False, server_default='sector'),
        sa.Column('date_planted', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='sin_verificar'),
        sa.Column('last_checked_at', sa.Date(), nullable=True),
        sa.Column('replaced_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('synced_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tomato_trees_project_id', 'tomato_trees', ['project_id'])
    op.create_index('ix_tomato_trees_active', 'tomato_trees', ['active'])

    op.create_table(
        'tomato_visits',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('tree_id', sa.Integer(), sa.ForeignKey('tomato_trees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('public_comment', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tomato_visits_tree_id', 'tomato_visits', ['tree_id'])

    op.create_table(
        'tomato_visit_photos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('visit_id', sa.Integer(), sa.ForeignKey('tomato_visits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tomato_visit_photos_visit_id', 'tomato_visit_photos', ['visit_id'])

    op.create_table(
        'tomato_sync_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('ok', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('trigger', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('received', sa.Integer(), nullable=True),
        sa.Column('created', sa.Integer(), nullable=True),
        sa.Column('updated', sa.Integer(), nullable=True),
        sa.Column('deactivated', sa.Integer(), nullable=True),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('tomato_sync_runs')
    op.drop_index('ix_tomato_visit_photos_visit_id', table_name='tomato_visit_photos')
    op.drop_table('tomato_visit_photos')
    op.drop_index('ix_tomato_visits_tree_id', table_name='tomato_visits')
    op.drop_table('tomato_visits')
    op.drop_index('ix_tomato_trees_active', table_name='tomato_trees')
    op.drop_index('ix_tomato_trees_project_id', table_name='tomato_trees')
    op.drop_table('tomato_trees')
