"""add_user_preferences

Revision ID: c5f8d2a71b93
Revises: b3c7e9a12d45
Create Date: 2026-03-10 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5f8d2a71b93'
down_revision: Union[str, None] = 'b3c7e9a12d45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('grade_level', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('writing_purpose', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'writing_purpose')
    op.drop_column('users', 'grade_level')
