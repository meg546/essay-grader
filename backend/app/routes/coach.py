from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.deps import get_db
from app.models.user import User
from app.schemas.coach import CoachRequest, CoachResponse
from app.services.coach import get_coaching_message

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("", response_model=CoachResponse)
async def coach(
    body: CoachRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    message = await get_coaching_message(
        db=db,
        user_id=user.id,
        context=body.context,
        submission_id=body.submission_id,
    )
    return CoachResponse(message=message)
