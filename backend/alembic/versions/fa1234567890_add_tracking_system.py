"""add tracking system

Revision ID: fa1234567890
Revises: f920caa12345
Create Date: 2026-06-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fa1234567890'
down_revision = 'd0cbd09f042e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create Campaign
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('prefix', sa.String(), nullable=True),
        sa.Column('require_photo_verification', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaigns_id'), 'campaigns', ['id'], unique=False)
    op.create_index(op.f('ix_campaigns_name'), 'campaigns', ['name'], unique=False)
    op.create_index(op.f('ix_campaigns_prefix'), 'campaigns', ['prefix'], unique=True)
    
    # 2. Add campaign_id to gifts
    op.add_column('gifts', sa.Column('campaign_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_gifts_campaigns', 'gifts', 'campaigns', ['campaign_id'], ['id'])

    # 3. Create TrackedTree
    op.create_table(
        'tracked_trees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_code', sa.String(), nullable=True),
        sa.Column('gift_id', sa.Integer(), nullable=True),
        sa.Column('species_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('planter_name', sa.String(), nullable=True),
        sa.Column('planter_email', sa.String(), nullable=True),
        sa.Column('photo_url', sa.String(), nullable=True),
        sa.Column('reminder_sent', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('planted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['gift_id'], ['gifts.id'], ),
        sa.ForeignKeyConstraint(['species_id'], ['tree_species.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tracked_trees_id'), 'tracked_trees', ['id'], unique=False)
    op.create_index(op.f('ix_tracked_trees_id_code'), 'tracked_trees', ['id_code'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_tracked_trees_id_code'), table_name='tracked_trees')
    op.drop_index(op.f('ix_tracked_trees_id'), table_name='tracked_trees')
    op.drop_table('tracked_trees')
    op.drop_constraint('fk_gifts_campaigns', 'gifts', type_='foreignkey')
    op.drop_column('gifts', 'campaign_id')
    op.drop_index(op.f('ix_campaigns_prefix'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_name'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_id'), table_name='campaigns')
    op.drop_table('campaigns')
