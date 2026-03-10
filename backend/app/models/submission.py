import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy import JSON  # NOT dialects.postgresql.JSONB -- SQLite test compat
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), nullable=False
    )
    essay_text: Mapped[str] = mapped_column(Text(), nullable=False)
    rubric_text: Mapped[str | None] = mapped_column(Text(), nullable=True)
    grade_level: Mapped[str] = mapped_column(String(50), nullable=False)
    result: Mapped[dict] = mapped_column(JSON(), nullable=False)
    essay_excerpt: Mapped[str] = mapped_column(String(200), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float(), nullable=False)
    max_score: Mapped[float] = mapped_column(Float(), nullable=False)
    category_count: Mapped[int] = mapped_column(Integer(), nullable=False)
    graded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    __table_args__ = (
        Index("ix_submissions_user_graded", "user_id", "graded_at"),
    )
