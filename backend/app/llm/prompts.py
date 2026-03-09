"""Prompt templates and schema builders for essay grading."""

DEFAULT_RUBRIC = """## Grading Rubric

### 1. Thesis & Argument (0-25 points)
Evaluates the clarity, originality, and strength of the central thesis or argument.
- Does the essay present a clear, debatable thesis?
- Is the argument logically structured and consistently developed?
- Does the writer demonstrate critical thinking?

### 2. Evidence & Support (0-25 points)
Evaluates the quality, relevance, and integration of supporting evidence.
- Are claims supported with specific, relevant evidence?
- Is evidence properly cited and contextualized?
- Does the writer analyze evidence rather than just presenting it?

### 3. Organization & Structure (0-25 points)
Evaluates the logical flow, paragraph structure, and overall coherence.
- Does the essay follow a clear organizational pattern?
- Are transitions between ideas smooth and logical?
- Does each paragraph have a clear purpose and topic sentence?

### 4. Language & Mechanics (0-25 points)
Evaluates grammar, word choice, sentence variety, and writing conventions.
- Is the writing grammatically correct with proper punctuation?
- Does the writer use varied sentence structures?
- Is the vocabulary appropriate for the audience and purpose?
"""

_GRADE_LEVEL_CONTEXT = {
    "elementary": (
        "The student is at an elementary school level. "
        "Be encouraging and focus on basic writing skills. "
        "Expect simple sentence structures and basic vocabulary. "
        "Grade leniently on citations and advanced argumentation."
    ),
    "middle school": (
        "The student is at a middle school level. "
        "Expect developing paragraph structure and some evidence use. "
        "Grade moderately on vocabulary complexity and citation format."
    ),
    "high school": (
        "The student is at a high school level. "
        "Expect clear thesis statements, organized paragraphs, and supporting evidence. "
        "Grade appropriately on analytical depth and writing conventions."
    ),
    "college": (
        "The student is at a college level. "
        "Expect sophisticated argumentation, thorough evidence integration, and polished prose. "
        "Grade rigorously on critical thinking, source analysis, and academic writing conventions."
    ),
    "graduate": (
        "The student is at a graduate level. "
        "Expect expert-level analysis, original contribution to discourse, and flawless academic writing. "
        "Grade at the highest standards for argumentation, methodology, and scholarly conventions."
    ),
}


def _get_grade_level_context(grade_level: str) -> str:
    """Return grade-level-specific grading instructions."""
    key = grade_level.lower().strip()
    if key in _GRADE_LEVEL_CONTEXT:
        return _GRADE_LEVEL_CONTEXT[key]
    return (
        f"The student is at the {grade_level} level. "
        "Adjust scoring expectations appropriately for this level."
    )


def build_system_prompt(grade_level: str, rubric_text: str | None) -> str:
    """Build the system prompt for essay grading.

    Args:
        grade_level: The student's grade level (e.g., "college", "high school").
        rubric_text: Optional custom rubric. Uses DEFAULT_RUBRIC if None.

    Returns:
        Complete system prompt string.
    """
    rubric = rubric_text if rubric_text else DEFAULT_RUBRIC
    grade_context = _get_grade_level_context(grade_level)

    return f"""You are an expert essay grader. Your task is to evaluate an essay according to the provided rubric and return a structured JSON response.

## Grade Level Context

{grade_context}

## Rubric

{rubric}

## Instructions

1. Read the essay carefully.
2. Evaluate the essay against each rubric category.
3. For each category, assign a score, list strengths and areas for improvement, and provide a justification.
4. For each category, quote EXACTLY from the essay, character-for-character, to support your evaluation. These quotes will be used to highlight passages in the original text.
5. Provide an overall summary of the essay's quality.

## CRITICAL: Quoting Rules

- Quote EXACTLY from the essay, character-for-character. Do not paraphrase or modify quotes.
- Each quote should be a meaningful passage (at least a few words) that illustrates a strength or area for improvement.
- Include the "type" field as either "strength" or "improvement" for each quote.
- Include a brief "feedback" explanation for why the passage was highlighted.

## Response Format

Respond with a JSON object matching the required schema. Use the category IDs: "thesis", "evidence", "organization", "language" (or IDs matching the provided rubric categories).
"""


def build_user_prompt(essay_text: str) -> str:
    """Wrap essay text in clear delimiters for the user prompt.

    Args:
        essay_text: The raw essay text to grade.

    Returns:
        User prompt string with delimited essay.
    """
    return f"""Please grade the following essay:

<essay>
{essay_text}
</essay>

Provide your evaluation as a JSON object following the specified schema."""


def build_grading_schema() -> dict:
    """Return JSON schema for the LLM grading output format.

    This is the intermediate format with quotes (not highlights).
    The quotes are later converted to highlight offsets by compute_highlights.

    Returns:
        JSON schema dict for structured LLM output.
    """
    return {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Overall summary of the essay quality",
            },
            "categories": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Category identifier (e.g., 'thesis', 'evidence')",
                        },
                        "name": {
                            "type": "string",
                            "description": "Human-readable category name",
                        },
                        "score": {
                            "type": "number",
                            "description": "Score for this category",
                        },
                        "maxScore": {
                            "type": "number",
                            "description": "Maximum possible score for this category",
                        },
                        "strengths": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of strengths in this category",
                        },
                        "improvements": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of areas for improvement",
                        },
                        "justification": {
                            "type": "string",
                            "description": "Explanation of the score",
                        },
                        "quotes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "text": {
                                        "type": "string",
                                        "description": "Exact quote from the essay",
                                    },
                                    "type": {
                                        "type": "string",
                                        "enum": ["strength", "improvement"],
                                        "description": "Whether this quote shows a strength or improvement area",
                                    },
                                    "feedback": {
                                        "type": "string",
                                        "description": "Brief explanation of why this passage was highlighted",
                                    },
                                },
                                "required": ["text", "type", "feedback"],
                            },
                            "description": "Quoted passages from the essay supporting the evaluation",
                        },
                    },
                    "required": [
                        "id",
                        "name",
                        "score",
                        "maxScore",
                        "strengths",
                        "improvements",
                        "justification",
                        "quotes",
                    ],
                },
            },
        },
        "required": ["summary", "categories"],
    }
