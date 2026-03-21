"""Rubric templates for multi-rubric training data augmentation.

Provides diverse rubric formats so the fine-tuned model generalizes
to arbitrary rubrics, not just one fixed format.
"""

# The app's default 4-category rubric (from backend/app/llm/prompts.py)
RUBRIC_DEFAULT_4CAT = """## Grading Rubric

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

# ASAP 2.0 / PERSUADE holistic rubric (1-6 scale)
RUBRIC_HOLISTIC_6PT = """## Holistic Essay Scoring Rubric (1-6 Scale)

Score each essay holistically on a 1-6 scale based on overall writing quality:

### Score 6 — Outstanding
- Effectively addresses the writing task with insightful critical thinking
- Well-organized with clear, logical progression of ideas
- Skillful use of evidence from sources with thorough analysis
- Demonstrates excellent command of language with varied sentence structures
- Minimal errors in grammar, usage, and mechanics

### Score 5 — Strong
- Addresses the writing task competently with clear critical thinking
- Well-organized with logical flow between ideas
- Effective use of evidence with analysis
- Good command of language with some sentence variety
- Few errors that do not interfere with meaning

### Score 4 — Adequate
- Addresses the writing task with adequate critical thinking
- Generally organized with some logical gaps
- Uses evidence but may lack thorough analysis
- Adequate language use with some sentence variety
- Some errors that occasionally interfere with meaning

### Score 3 — Developing
- Partially addresses the writing task with limited critical thinking
- Inconsistent organization with unclear transitions
- Limited or superficial use of evidence
- Basic language use with little sentence variety
- Errors that sometimes interfere with meaning

### Score 2 — Weak
- Minimally addresses the writing task
- Poor organization with little logical flow
- Little to no evidence from sources
- Limited vocabulary and sentence patterns
- Frequent errors that interfere with meaning

### Score 1 — Inadequate
- Fails to address the writing task
- No discernible organization
- No use of evidence
- Severe problems with language use
- Pervasive errors that make the essay largely unreadable
"""

# Simplified 3-category rubric for variety
RUBRIC_SIMPLIFIED_3CAT = """## Essay Grading Rubric

### 1. Content & Ideas (0-30 points)
- Does the essay present a clear main idea or argument?
- Are ideas developed with supporting details and examples?
- Does the writer demonstrate understanding of the topic?

### 2. Organization & Clarity (0-35 points)
- Is the essay well-organized with introduction, body, and conclusion?
- Do paragraphs flow logically from one to the next?
- Is the writing clear and easy to follow?

### 3. Language & Conventions (0-35 points)
- Is the writing grammatically correct?
- Does the writer use appropriate vocabulary?
- Are spelling, punctuation, and capitalization correct?
"""

# 5-trait analytical rubric
RUBRIC_ANALYTICAL_5TRAIT = """## Analytical Writing Rubric

### 1. Ideas & Content (0-20 points)
The main idea is clear, focused, and supported with relevant details.

### 2. Organization (0-20 points)
The essay has a clear structure with effective introduction, body, and conclusion.
Transitions between paragraphs are smooth and logical.

### 3. Voice & Tone (0-20 points)
The writing has a clear voice appropriate to the audience and purpose.
The tone is consistent and engaging.

### 4. Word Choice (0-20 points)
Words are precise, natural, and effective. Vocabulary is appropriate
for the topic and audience.

### 5. Conventions (0-20 points)
Grammar, spelling, punctuation, and capitalization are correct.
The essay follows standard writing conventions.
"""

# All rubrics with metadata
RUBRICS = [
    {
        "id": "default_4cat",
        "name": "4-Category Standard",
        "text": RUBRIC_DEFAULT_4CAT,
        "weight": 0.35,  # Probability of selecting this rubric
    },
    {
        "id": "holistic_6pt",
        "name": "Holistic 6-Point",
        "text": RUBRIC_HOLISTIC_6PT,
        "weight": 0.30,
    },
    {
        "id": "simplified_3cat",
        "name": "Simplified 3-Category",
        "text": RUBRIC_SIMPLIFIED_3CAT,
        "weight": 0.20,
    },
    {
        "id": "analytical_5trait",
        "name": "Analytical 5-Trait",
        "text": RUBRIC_ANALYTICAL_5TRAIT,
        "weight": 0.15,
    },
]


def select_rubric(rng) -> dict:
    """Select a rubric weighted by the distribution defined above."""
    weights = [r["weight"] for r in RUBRICS]
    idx = rng.choices(range(len(RUBRICS)), weights=weights, k=1)[0]
    return RUBRICS[idx]
