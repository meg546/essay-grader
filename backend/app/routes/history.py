"""History endpoints: list, detail, and delete past submissions."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response

from app.auth.dependencies import get_current_user
from app.deps import get_db
from app.models.submission import Submission
from app.models.user import User
from app.schemas.history import HistoryItem

router = APIRouter(tags=["history"])


@router.get("/history")
async def list_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HistoryItem]:
    result = await db.execute(
        select(Submission)
        .where(Submission.user_id == user.id)
        .order_by(Submission.graded_at.desc())
    )
    submissions = result.scalars().all()
    return [
        HistoryItem(
            id=str(s.id),
            essay_excerpt=s.essay_excerpt,
            overall_score=s.overall_score,
            max_score=s.max_score,
            category_count=s.category_count,
            graded_at=s.graded_at.isoformat(),
        )
        for s in submissions
    ]


@router.get("/history/{submission_id}")
async def get_history_item(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Submission).where(
        Submission.id == uuid.UUID(submission_id),
        Submission.user_id == user.id,
    )
    result = await db.execute(stmt)
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission.result


@router.delete("/history/{submission_id}", status_code=204)
async def delete_history_item(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Submission).where(
        Submission.id == uuid.UUID(submission_id),
        Submission.user_id == user.id,
    )
    result = await db.execute(stmt)
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    await db.delete(submission)
    await db.commit()
    return Response(status_code=204)
