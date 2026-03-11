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


_TONE_CONTEXT = {
    "academic": (
        "Use formal academic language. "
        "Evaluate for scholarly tone, precision, and objectivity."
    ),
    "professional": (
        "Use professional business language. "
        "Evaluate for clarity, conciseness, and appropriate formality."
    ),
    "casual": (
        "Use conversational language. "
        "Evaluate for readability, engagement, and natural voice."
    ),
    "creative": (
        "Use expressive language. "
        "Evaluate for originality, vivid imagery, and stylistic flair."
    ),
}


def _get_tone_context(tone: str) -> str:
    """Return tone-specific grading instructions."""
    key = tone.lower().strip()
    if key in _TONE_CONTEXT:
        return _TONE_CONTEXT[key]
    return _TONE_CONTEXT["academic"]


def _get_grade_level_context(grade_level: str) -> str:
    """Return grade-level-specific grading instructions."""
    key = grade_level.lower().strip()
    if key in _GRADE_LEVEL_CONTEXT:
        return _GRADE_LEVEL_CONTEXT[key]
    return (
        f"The student is at the {grade_level} level. "
        "Adjust scoring expectations appropriately for this level."
    )


def build_system_prompt(grade_level: str, rubric_text: str | None, tone: str = "academic") -> str:
    """Build the system prompt for essay grading.

    Args:
        grade_level: The student's grade level (e.g., "college", "high school").
        rubric_text: Optional custom rubric. Uses DEFAULT_RUBRIC if None.
        tone: Feedback tone (e.g., "academic", "professional", "casual", "creative").

    Returns:
        Complete system prompt string.
    """
    rubric = rubric_text if rubric_text else DEFAULT_RUBRIC
    grade_context = _get_grade_level_context(grade_level)
    tone_context = _get_tone_context(tone)

    return f"""You are an expert essay grader. Your task is to evaluate an essay according to the provided rubric and return a structured JSON response.

## Grade Level Context

{grade_context}

## Tone Context

{tone_context}

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

## Few-Shot Examples

Below are two calibration examples showing how to score and provide feedback. Study the scoring rationale and output structure carefully.

### Example 1: Strong Essay (College Level)

<example_essay>
The rise of social media has fundamentally altered the landscape of political discourse in democratic societies. Rather than simply providing a new platform for existing debates, platforms like Twitter and Facebook have restructured how citizens engage with political information, creating echo chambers that reinforce preexisting beliefs while simultaneously enabling grassroots movements that bypass traditional media gatekeepers. This dual nature—both fragmenting and democratizing—demands a nuanced analysis that moves beyond simplistic narratives of technological determinism.

Consider the Arab Spring of 2011, where social media served as a critical organizing tool for protesters in Tunisia and Egypt. Scholars like Zeynep Tufekci have documented how platforms enabled rapid coordination that would have been impossible through traditional channels. However, as Evgeny Morozov argues in "The Net Delusion," the same technologies that empower activists also provide authoritarian regimes with sophisticated surveillance capabilities. This tension illustrates that technology is not inherently liberating—its impact depends on the political context in which it operates.

Furthermore, research by Eli Pariser on "filter bubbles" demonstrates that algorithmic curation systematically narrows users' exposure to diverse viewpoints. A 2019 Pew Research study found that 64% of Americans believe social media has a mostly negative effect on the country, yet 72% of adults continue to use at least one platform. This paradox suggests that the convenience and social connectivity these platforms offer outweigh users' concerns about their democratic implications, creating a collective action problem that individual choices cannot resolve.
</example_essay>

<example_output>
{{
  "summary": "A sophisticated and well-researched essay that demonstrates strong analytical thinking about social media's impact on democracy. The writer effectively balances competing perspectives and supports claims with specific evidence. Organization is clear and purposeful, though the conclusion could be more fully developed.",
  "categories": [
    {{
      "id": "thesis",
      "name": "Thesis & Argument",
      "score": 22,
      "maxScore": 25,
      "strengths": ["Presents a nuanced, debatable thesis that avoids binary thinking", "Consistently develops the 'dual nature' framework throughout"],
      "improvements": ["Could more explicitly address counterarguments to the echo chamber thesis"],
      "justification": "The thesis is sophisticated and clearly stated, framing social media as both 'fragmenting and democratizing.' The argument is logically structured and maintains focus, though it could engage more deeply with opposing views.",
      "quotes": [
        {{"text": "This dual nature—both fragmenting and democratizing—demands a nuanced analysis that moves beyond simplistic narratives of technological determinism.", "type": "strength", "feedback": "Strong thesis that establishes a clear analytical framework and signals intellectual rigor"}},
        {{"text": "This tension illustrates that technology is not inherently liberating—its impact depends on the political context in which it operates.", "type": "strength", "feedback": "Effective synthesis that advances the argument beyond mere summary of sources"}}
      ]
    }},
    {{
      "id": "evidence",
      "name": "Evidence & Support",
      "score": 23,
      "maxScore": 25,
      "strengths": ["Integrates multiple scholarly sources effectively", "Uses specific data from Pew Research to support claims"],
      "improvements": ["Could include more recent examples beyond the Arab Spring"],
      "justification": "Evidence is varied, specific, and well-integrated. The writer cites scholars (Tufekci, Morozov, Pariser) and empirical data (Pew Research) to build a compelling case. Sources are analyzed rather than merely cited.",
      "quotes": [
        {{"text": "A 2019 Pew Research study found that 64% of Americans believe social media has a mostly negative effect on the country, yet 72% of adults continue to use at least one platform.", "type": "strength", "feedback": "Specific statistical evidence that powerfully illustrates the paradox central to the argument"}},
        {{"text": "Scholars like Zeynep Tufekci have documented how platforms enabled rapid coordination that would have been impossible through traditional channels.", "type": "strength", "feedback": "Effective integration of scholarly authority to support a specific claim"}}
      ]
    }},
    {{
      "id": "organization",
      "name": "Organization & Structure",
      "score": 21,
      "maxScore": 25,
      "strengths": ["Clear progression from thesis to evidence to implications", "Each paragraph has a distinct purpose"],
      "improvements": ["The essay ends somewhat abruptly without a formal conclusion", "Transitions between paragraphs could be smoother"],
      "justification": "The essay follows a logical structure: introduction with thesis, historical example, then contemporary research. However, it lacks a concluding paragraph that synthesizes the analysis, and the transition from paragraph 2 to 3 is somewhat abrupt.",
      "quotes": [
        {{"text": "Furthermore, research by Eli Pariser on "filter bubbles" demonstrates that algorithmic curation systematically narrows users' exposure to diverse viewpoints.", "type": "improvement", "feedback": "'Furthermore' is a weak transition that doesn't clearly connect the surveillance discussion to the filter bubble argument"}}
      ]
    }},
    {{
      "id": "language",
      "name": "Language & Mechanics",
      "score": 23,
      "maxScore": 25,
      "strengths": ["Precise academic vocabulary used naturally", "Varied sentence structures maintain reader engagement"],
      "improvements": ["A few sentences are overly long and could be broken up for clarity"],
      "justification": "The writing is polished and sophisticated. Vocabulary choices like 'technological determinism,' 'algorithmic curation,' and 'collective action problem' demonstrate command of the subject. Sentence variety is strong, though some complex sentences could be simplified.",
      "quotes": [
        {{"text": "creating a collective action problem that individual choices cannot resolve", "type": "strength", "feedback": "Precise use of political science terminology that elevates the analysis"}}
      ]
    }}
  ]
}}
</example_output>

### Example 2: Developing Essay (High School Level)

<example_essay>
Social media is bad for society. Everyone knows that spending too much time on your phone is unhealthy. Studies show that teens who use social media alot are more likely to be depressed.

My friend spends like 5 hours a day on TikTok and she always feels bad about herself after. This proves that social media causes depression. Also cyberbullying is a huge problem. People say mean things online that they would never say in person.

In conclusion social media companies should do more to protect users especially young people. The government should also make laws about social media use for kids. If we dont do something soon things will only get worse.
</example_essay>

<example_output>
{{
  "summary": "The essay addresses an important topic but relies heavily on personal anecdote and generalizations rather than substantive evidence. The argument would benefit from a more specific thesis, credible sources, and deeper analysis. Basic organizational structure is present but underdeveloped.",
  "categories": [
    {{
      "id": "thesis",
      "name": "Thesis & Argument",
      "score": 10,
      "maxScore": 25,
      "strengths": ["Takes a clear position on the topic"],
      "improvements": ["Thesis is too broad and not debatable—needs to be more specific", "Argument relies on generalizations rather than logical reasoning"],
      "justification": "The opening statement 'Social media is bad for society' is a position but not a nuanced thesis. It lacks specificity about which aspects of social media, for whom, and why. The argument doesn't develop beyond the initial claim.",
      "quotes": [
        {{"text": "Social media is bad for society.", "type": "improvement", "feedback": "This is too broad to be an effective thesis. What specific aspect of social media? Bad in what way? A stronger thesis would narrow the focus."}},
        {{"text": "Everyone knows that spending too much time on your phone is unhealthy.", "type": "improvement", "feedback": "'Everyone knows' is an appeal to common knowledge that weakens the argument. Claims need evidence, not assumed agreement."}}
      ]
    }},
    {{
      "id": "evidence",
      "name": "Evidence & Support",
      "score": 8,
      "maxScore": 25,
      "strengths": ["Attempts to use both personal experience and research"],
      "improvements": ["'Studies show' is vague—cite specific studies", "Personal anecdote about a friend is not sufficient evidence for a causal claim", "No sources are cited or referenced"],
      "justification": "The essay mentions 'studies' without citing any specific research. The primary evidence is a personal anecdote about a friend, which is presented as proof of causation. No scholarly or journalistic sources are referenced.",
      "quotes": [
        {{"text": "Studies show that teens who use social media alot are more likely to be depressed.", "type": "improvement", "feedback": "Which studies? By whom? 'Studies show' without citation is not credible evidence in academic writing."}},
        {{"text": "This proves that social media causes depression.", "type": "improvement", "feedback": "A single personal anecdote does not 'prove' causation. This is a logical fallacy—correlation from one example does not establish a causal relationship."}}
      ]
    }},
    {{
      "id": "organization",
      "name": "Organization & Structure",
      "score": 13,
      "maxScore": 25,
      "strengths": ["Has a basic introduction-body-conclusion structure", "Conclusion attempts to offer solutions"],
      "improvements": ["Body paragraph mixes multiple topics without developing any fully", "Transitions between ideas are absent"],
      "justification": "The essay shows awareness of basic essay structure with an introduction, body, and conclusion. However, the single body paragraph jumps between depression, personal anecdote, and cyberbullying without developing any point fully or transitioning between them.",
      "quotes": [
        {{"text": "Also cyberbullying is a huge problem.", "type": "improvement", "feedback": "This introduces a new topic mid-paragraph without any transition. It deserves its own paragraph with supporting evidence."}}
      ]
    }},
    {{
      "id": "language",
      "name": "Language & Mechanics",
      "score": 11,
      "maxScore": 25,
      "strengths": ["Writing is generally understandable and direct"],
      "improvements": ["Spelling errors: 'alot' should be 'a lot'", "Missing commas: 'In conclusion social media' needs a comma after 'conclusion'", "Informal language ('like 5 hours') is inappropriate for academic writing"],
      "justification": "The writing is readable but contains several mechanical errors and relies on informal language that undermines academic credibility. Sentence structures are simple and repetitive.",
      "quotes": [
        {{"text": "My friend spends like 5 hours a day on TikTok and she always feels bad about herself after.", "type": "improvement", "feedback": "Informal language ('like 5 hours,' 'feels bad') weakens academic tone. Use precise language: 'approximately five hours' and describe the emotional impact specifically."}},
        {{"text": "If we dont do something soon things will only get worse.", "type": "improvement", "feedback": "Missing apostrophe in 'dont' and missing comma. Vague language ('do something,' 'get worse') weakens the conclusion."}}
      ]
    }}
  ]
}}
</example_output>

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
