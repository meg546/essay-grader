# Phase 13: LLM Inference & Grading - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users submit an essay with a rubric and receive a complete GradingResult with scores, feedback, and highlighted passages. Covers model inference pipeline with multi-provider support, prompt engineering, structured output validation, highlight generation with character offsets, and PDF parsing for both rubrics and essays. No persistence (Phase 14) or frontend integration (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Inference setup
- Ollama as primary local model server, calling OpenAI-compatible /v1/chat/completions endpoint
- Provider adapter pattern: abstract LLMClient interface with three adapters (Ollama, Anthropic, OpenAI)
- All three providers supported at launch — swap via MODEL_PROVIDER env var
- Separate env vars: MODEL_PROVIDER (ollama/anthropic/openai), MODEL_NAME (e.g., llama3.2:3b), MODEL_ENDPOINT (e.g., http://localhost:11434)
- For Anthropic: uses ANTHROPIC_API_KEY env var; for OpenAI: uses OPENAI_API_KEY
- Retry once on timeout/connection error, then return 502/503 with clear error message
- Timeout duration: Claude's discretion based on typical inference times

### Prompt strategy
- Single prompt approach: one LLM call produces complete GradingResult JSON (scores, feedback, highlights)
- Provider-native JSON modes for structured output: Ollama format=json, Anthropic tool_use with schema, OpenAI response_format json_object
- Grade level affects scoring via prompt injection: include grade level context in system prompt to adjust expectations for vocabulary, argumentation, citations
- Default rubric used when no rubric provided — built-in general writing rubric (clarity, organization, evidence, mechanics). Matches current frontend behavior where rubric is optional

### Highlight generation
- Two-pass within single prompt: LLM quotes essay passages, Python computes character offsets post-inference
- Fuzzy matching with fallback: try exact str.find() first, then fuzzy match (difflib or rapidfuzz). Drop highlights below confidence threshold rather than showing wrong ones
- LLM decides how many highlights per category (no fixed limit) — as many as relevant
- Overlapping highlights allowed — same passage can be highlighted by multiple categories. Frontend HighlightProvider already handles stacked highlights
- Empty highlights array accepted gracefully for categories with no relevant passages — no retry

### PDF rubric handling
- Single endpoint POST /api/grade with multipart form data
- Accepts optional rubric_file (PDF) OR rubric_text (string), plus optional essay_file (PDF) OR essay_text (string)
- Backend extracts text from both essay and rubric PDFs using pypdf (not PyMuPDF due to AGPL)
- Minimum length validation: if extracted PDF text is under ~50 characters, return 422 with message to paste text instead
- 10 MB max file size limit for PDF uploads (413 on exceed)

### Claude's Discretion
- Exact system prompt wording and structure
- Inference timeout duration
- Fuzzy matching threshold and algorithm choice
- Default rubric content and category definitions
- Pydantic validation/retry logic for malformed LLM output
- Error response message wording

</decisions>

<specifics>
## Specific Ideas

- Frontend currently does client-side PDF extraction with pdf.js — backend should take over this responsibility. Frontend will need updating in Phase 15 to upload PDFs directly instead of extracting client-side
- Pydantic schemas already exist: GradingResult, CategoryScore, HighlightRange in backend/app/schemas/grading.py — LLM output must match these shapes
- GradeEssayRequest from frontend sends essayText, rubricText (optional), gradeLevel as strings
- Settings class in config.py already has the pattern for env-based config — add MODEL_PROVIDER, MODEL_NAME, MODEL_ENDPOINT there
- STATE.md notes this is the highest-risk phase: LLM structured output reliability with smaller models needs iterative prompt testing

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- backend/app/schemas/grading.py: GradingResult, CategoryScore, HighlightRange Pydantic models already defined with camelCase serialization
- backend/app/schemas/base.py: CamelModel base class for consistent camelCase JSON output
- backend/app/config.py: Settings class with pydantic-settings, env file loading, lru_cache pattern
- backend/app/auth/dependencies.py: get_current_user dependency for route protection (Phase 13 grading endpoint should be auth-protected)
- src/api/types.ts: Frontend TypeScript interfaces that backend response must match exactly

### Established Patterns
- Async everywhere: async database sessions, async route handlers — inference calls should be async too
- FastAPI dependency injection for auth, database sessions
- APIRouter with /api prefix, mounted in main.py
- pytest with httpx AsyncClient for integration tests

### Integration Points
- backend/app/main.py: mount grading router via include_router
- backend/app/config.py: add MODEL_PROVIDER, MODEL_NAME, MODEL_ENDPOINT settings
- backend/pyproject.toml: add httpx, pypdf, anthropic, openai dependencies
- .env: add model configuration variables

</code_context>

<deferred>
## Deferred Ideas

- Frontend needs to stop doing client-side PDF extraction and instead upload PDFs to backend — Phase 15 (Frontend Integration)
- Streaming SSE for progressive result rendering during inference — v2.1 (STREAM-01, STREAM-02)
- Dynamic rubric-aligned category generation (LLM reads rubric and creates domain-specific categories) — v2.1 (ADVGRADE-01)

</deferred>

---

*Phase: 13-llm-inference-grading*
*Context gathered: 2026-03-09*
