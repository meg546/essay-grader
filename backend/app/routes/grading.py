"""POST /api/grade endpoint with multipart form handling."""

from __future__ import annotations

from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.deps import get_db
from app.llm.client import get_llm_client
from app.llm.pdf import extract_pdf_text
from app.models.submission import Submission
from app.models.user import User
from app.services.grading import GradingService

router = APIRouter(tags=["grading"])


@router.post("/grade")
async def grade_essay(
    essay_text: str | None = Form(None),
    essay_file: UploadFile | None = File(None),
    rubric_text: str | None = Form(None),
    rubric_file: UploadFile | None = File(None),
    grade_level: str = Form("college"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Grade an essay using the LLM grading pipeline.

    Accepts essay as text or PDF file, optional rubric as text or PDF file,
    and an optional grade level (defaults to "college").
    """
    # Validate: must have either essay_text or essay_file
    if not essay_text and not essay_file:
        raise HTTPException(
            status_code=422,
            detail="Either essay_text or essay_file is required",
        )

    # Extract text from PDFs if provided
    if essay_file:
        essay_text = await extract_pdf_text(essay_file)

    if rubric_file:
        rubric_text = await extract_pdf_text(rubric_file)

    # Create LLM client and grading service
    settings = get_settings()
    llm_client = get_llm_client(settings)
    grading_service = GradingService(llm_client)

    try:
        result = await grading_service.grade(essay_text, rubric_text, grade_level)
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Model inference failed: {exc}",
        )
    except (httpx.ConnectError, httpx.TimeoutException):
        raise HTTPException(
            status_code=503,
            detail="Model server unavailable. Check MODEL_ENDPOINT configuration.",
        )

    # Auto-save grading result to database
    submission = Submission(
        user_id=user.id,
        essay_text=essay_text,
        rubric_text=rubric_text,
        grade_level=grade_level,
        result=result.model_dump(by_alias=True),
        essay_excerpt=result.essay_excerpt,
        overall_score=result.overall_score,
        max_score=result.max_score,
        category_count=len(result.categories),
        graded_at=datetime.fromisoformat(result.graded_at),
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    result.id = str(submission.id)

    return result
