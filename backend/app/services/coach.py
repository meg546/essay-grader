import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.llm.client import get_llm_client
from app.config import get_settings
from app.models.submission import Submission
from app.schemas.coach import CoachContext

logger = logging.getLogger(__name__)

FALLBACK_MESSAGES = {
    CoachContext.RESULTS_RECEIVED: "Nice work submitting that essay! Keep writing and improving.",
    CoachContext.IDLE_NUDGE: "Ready to write? Every essay is a chance to get better!",
    CoachContext.HISTORY_VISIT: "Looking back at your work? That's a great habit!",
    CoachContext.ON_DEMAND: "Need a tip? Try reading your essay out loud — you'll catch things you missed.",
    CoachContext.GREETING: "Hey there! Ready to write something great today?",
}

SYSTEM_PROMPT = """You are a friendly red fox mascot named Redpen who lives inside a writing app. You give short, personalized writing tips and encouragement.

Personality:
- Friendly, slightly cheeky, always encouraging
- Never condescending or harsh
- Casual language, can be playful
- Keep responses to 1-2 short sentences max

Respond with ONLY the message text, no JSON, no quotes, no extra formatting."""

CONTEXT_TEMPLATES = {
    CoachContext.RESULTS_RECEIVED: "The student just received grading results. {summary}",
    CoachContext.IDLE_NUDGE: "The student has been idle. {summary}",
    CoachContext.HISTORY_VISIT: "The student is browsing their essay history. {summary}",
    CoachContext.ON_DEMAND: "The student clicked on you for a tip. {summary}",
    CoachContext.GREETING: "The student just opened the app. {summary}",
}


async def _compute_history_summary(
    db: AsyncSession, user_id: UUID, submission_id: Optional[UUID] = None
) -> str:
    """Build a text summary of the user's grading history for the LLM prompt."""
    # Get total count and average score
    result = await db.execute(
        select(
            func.count(Submission.id),
            func.avg(Submission.overall_score),
            func.avg(Submission.max_score),
        ).where(Submission.user_id == user_id)
    )
    row = result.one()
    total = row[0] or 0
    avg_score = row[1]
    avg_max = row[2]

    if total == 0:
        return "This is a new user with no grading history yet."

    parts = [f"They have submitted {total} essay(s)."]

    if avg_score is not None and avg_max is not None and avg_max > 0:
        pct = (avg_score / avg_max) * 100
        parts.append(f"Average score: {pct:.0f}%.")

    # Get the specific submission if provided
    if submission_id:
        sub = await db.execute(
            select(Submission).where(
                Submission.id == submission_id, Submission.user_id == user_id
            )
        )
        submission = sub.scalar_one_or_none()
        if submission and submission.result:
            result_data = submission.result
            score = result_data.get("overall_score", 0)
            max_score = result_data.get("max_score", 100)
            pct = (score / max_score) * 100 if max_score > 0 else 0
            parts.append(f"Latest essay scored {pct:.0f}%.")

            # Find weakest and strongest categories
            categories = result_data.get("categories", [])
            if categories:
                sorted_cats = sorted(
                    categories,
                    key=lambda c: c.get("score", 0) / max(c.get("max_score", 1), 1),
                )
                weakest = sorted_cats[0].get("name", "unknown")
                strongest = sorted_cats[-1].get("name", "unknown")
                parts.append(f"Weakest: {weakest}. Strongest: {strongest}.")

    return " ".join(parts)


async def get_coaching_message(
    db: AsyncSession,
    user_id: UUID,
    context: CoachContext,
    submission_id: Optional[UUID] = None,
) -> str:
    """Generate a coaching message using the LLM."""
    try:
        summary = await _compute_history_summary(db, user_id, submission_id)
        user_prompt = CONTEXT_TEMPLATES[context].format(summary=summary)

        settings = get_settings()
        client = get_llm_client(settings)
        response = await client.complete(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_schema=None,
        )

        # The response should be plain text, strip any quotes
        message = response.strip().strip('"').strip("'")
        if len(message) > 200:
            message = message[:200] + "..."

        return message

    except Exception:
        logger.exception("Coach LLM call failed, using fallback")
        return FALLBACK_MESSAGES.get(
            context, "Keep writing — every essay makes you better!"
        )
