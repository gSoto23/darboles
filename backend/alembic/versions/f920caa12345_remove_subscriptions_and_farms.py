"""remove_subscriptions_and_farms

Revision ID: f920caa12345
Revises: 5c436d043539
Create Date: 2026-04-10 20:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f920caa12345'
down_revision = '2cf15b44bdba'
branch_labels = None
depends_on = None

def upgrade():
    # drop in correct order due to foreign keys
    op.drop_table('subscription_invoices')
    op.drop_table('subscriptions')
    op.drop_table('farms')

def downgrade():
    pass
