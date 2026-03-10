---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Onboarding & Layout Redesign
status: planning
stopped_at: null
last_updated: "2026-03-10T15:30:00.000Z"
last_activity: 2026-03-10 -- Milestone v2.1 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages
**Current focus:** v2.1 Onboarding & Layout Redesign -- Defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-10 — Milestone v2.1 started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity (from v1.0 + v1.1):**
- Total plans completed: 17
- Feature commits: 28 (13 v1.0 + 15 v1.1)
- Total LOC: 2,541 across 38 files

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [11-01] Used APIRouter(prefix="/api") instead of root_path="/api" to avoid OpenAPI docs path issues
- [11-01] .env excluded from git via .gitignore -- created locally with sensible defaults
- [Phase 11-02]: Used manual alembic revision instead of --autogenerate since Docker PostgreSQL not running; verified via offline SQL generation
- [Phase 12-01]: Used Alembic autogenerate since PostgreSQL was available (unlike phase 11)
- [Phase 12-02]: Used HTTPBearer(auto_error=False) with manual None check for consistent 401 on missing tokens
- [Phase 12-02]: Switched User.id to dialect-agnostic sqlalchemy.Uuid for SQLite test compatibility
- [Phase 13-01]: Used typing.Protocol for LLMClient interface (structural subtyping, no inheritance)
- [Phase 13-01]: Ollama adapter uses /v1/chat/completions OpenAI-compat endpoint
- [Phase 13-01]: Anthropic adapter uses tool_use pattern for structured JSON output
- [Phase 13-02]: Used difflib.SequenceMatcher for fuzzy matching (stdlib, no extra dependency)
- [Phase 13-02]: LLM quotes text, Python computes highlight offsets post-inference
- [Phase 13-03]: Route instantiates LLM client inline via get_llm_client(get_settings())
- [Phase 13-03]: Tests mock get_llm_client at route module level for deterministic integration testing
- [Phase 14-01]: Used sqlalchemy.JSON instead of JSONB for SQLite test compatibility
- [Phase 14-01]: Manual Alembic migration (Docker PostgreSQL not up to date for autogenerate)
- [Phase 14-01]: Auto-save in route layer (not service layer) to keep GradingService pure
- [Phase 14-02]: Return JSONB result dict directly for detail endpoint (already camelCase)
- [Phase 14-02]: Uniform 404 for missing and other-user submissions (no info leakage)
- [Phase 15-01]: Persist essayText in app store so users don't lose essay on refresh
- [Phase 15-01]: Remove local history from app store entirely (backend is source of truth)
- [Phase 15-02]: Always use FormData for grading requests (backend Form() fields, not JSON body)
- [Phase 15-02]: Rubric text extraction deferred to backend; frontend only keeps File reference
- [Phase 15-03]: Ollama uses response_format.schema for structured output enforcement
- [Phase 15-03]: OpenAI uses json_schema response_format type with strict=False
- [Phase 15-03]: Alt quote key normalization checks highlighted_passages, evidence_quotes, evidence

### Pending Todos

None.

### Blockers/Concerns

- Phase 13 is highest-risk: LLM structured output reliability with Llama 3.2 3B needs iterative prompt testing
- pwdlib replaces passlib (unmaintained); pypdf replaces PyMuPDF (AGPL license)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 3 | Fix PDF upload formatting - extra blank lines between every line not preserving original structure | 2026-03-10 | 89ee416 | [3-fix-pdf-upload-formatting-extra-blank-li](./quick/3-fix-pdf-upload-formatting-extra-blank-li/) |
| 4 | Sign-in popup when unauthenticated user clicks Submit for Grading | 2026-03-10 | 72f4400 | [4-sign-in-popup-when-unauthenticated-user-](./quick/4-sign-in-popup-when-unauthenticated-user-/) |

## Session Continuity

Last session: 2026-03-10T15:14:23Z
Stopped at: Completed quick task 4 (sign-in popup for unauthenticated users)
Resume file: None
