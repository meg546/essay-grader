from app.schemas.base import CamelModel


class SuggestionRequest(CamelModel):
    flagged_text: str
    sentence_context: str
    category: str


class SuggestionResponse(CamelModel):
    message: str
    suggestions: list[str]
