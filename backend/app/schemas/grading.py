from .base import CamelModel


class HighlightRange(CamelModel):
    start: int
    end: int
    category_id: str
    type: str
    feedback: str


class CategoryScore(CamelModel):
    id: str
    name: str
    score: float
    max_score: float
    strengths: list[str]
    improvements: list[str]
    justification: str
    highlights: list[HighlightRange]


class GradingResult(CamelModel):
    id: str
    essay_text: str
    essay_excerpt: str
    overall_score: float
    max_score: float
    summary: str
    categories: list[CategoryScore]
    graded_at: str
