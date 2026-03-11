from enum import Enum
from typing import Optional
from uuid import UUID

from app.schemas.base import CamelModel


class CoachContext(str, Enum):
    RESULTS_RECEIVED = "results_received"
    IDLE_NUDGE = "idle_nudge"
    HISTORY_VISIT = "history_visit"
    ON_DEMAND = "on_demand"
    GREETING = "greeting"


class CoachRequest(CamelModel):
    context: CoachContext
    submission_id: Optional[UUID] = None


class CoachResponse(CamelModel):
    message: str
    fox_state: str = "coaching"
