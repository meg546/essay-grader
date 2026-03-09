from .base import CamelModel


class HistoryItem(CamelModel):
    id: str
    essay_excerpt: str
    overall_score: float
    max_score: float
    category_count: int
    graded_at: str
