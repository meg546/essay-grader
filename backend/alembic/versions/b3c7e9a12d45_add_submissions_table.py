"""add_submissions_table

Revision ID: b3c7e9a12d45
Revises: ad42fbd06e81
Create Date: 2026-03-10 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c7e9a12d45'
down_revision: Union[str, Sequence[str], None] = 'ad42fbd06e81'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('submissions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('essay_text', sa.Text(), nullable=False),
    sa.Column('rubric_text', sa.Text(), nullable=True),
    sa.Column('grade_level', sa.String(length=50), nullable=False),
    sa.Column('result', sa.JSON(), nullable=False),
    sa.Column('essay_excerpt', sa.String(length=200), nullable=False),
    sa.Column('overall_score', sa.Float(), nullable=False),
    sa.Column('max_score', sa.Float(), nullable=False),
    sa.Column('category_count', sa.Integer(), nullable=False),
    sa.Column('graded_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_submissions_user_graded', 'submissions', ['user_id', 'graded_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_submissions_user_graded', table_name='submissions')
    op.drop_table('submissions')
