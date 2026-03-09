# Phase 14: Persistence & History - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Store grading results in PostgreSQL on completion and expose history endpoints so users can view past submissions and reload full grading results. Covers the Submission model, auto-save on grade, list/detail/delete endpoints. No frontend changes (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Storage schema
- Single `submissions` table with JSONB `result` column for the full GradingResult
- Top-level columns for list-query performance: `essay_excerpt`, `overall_score`, `max_score`, `category_count`
- Full column list: id (UUID PK), user_id (FK → users), essay_text (TEXT), rubric_text (TEXT nullable), grade_level (VARCHAR), result (JSONB), essay_excerpt (VARCHAR 200), overall_score (FLOAT), max_score (FLOAT), category_count (INT), graded_at (TIMESTAMP)
- Populated on insert: extract list fields from GradingResult before saving

### Save trigger
- Auto-save: every grading result is persisted immediately after LLM inference completes
- POST /api/grade saves to DB automatically, returns GradingResult with the saved submission ID
- No separate "save" endpoint — grading and persistence are one operation

### History list
- GET /api/history returns all submissions for the authenticated user, sorted by graded_at descending (newest first)
- No pagination — load all at once (single-user academic project, list won't grow huge)
- Returns HistoryItem shape: id, essayExcerpt, overallScore, maxScore, categoryCount, gradedAt

### Detail retrieval
- GET /api/history/:id returns the full GradingResult from the JSONB column — identical shape to fresh grading response
- 404 for both missing submissions and submissions belonging to other users (no information leakage)

### Delete
- DELETE /api/history/:id removes a submission (hard delete)
- 404 if not found or belongs to another user (same as detail)
- Returns 204 No Content on success

### Claude's Discretion
- Exact Alembic migration naming and implementation
- Whether to add an index on user_id + graded_at
- Error response message wording
- How to integrate auto-save into the existing grading route (modify route vs service layer)

</decisions>

<specifics>
## Specific Ideas

- Frontend already has HistoryItem and GradingResult types in src/api/types.ts — backend responses must match exactly
- Frontend mock history.ts shows getHistory() and getHistoryItem(id) — backend endpoints should be drop-in replacements
- Pydantic HistoryItem schema already exists in backend/app/schemas/history.py with correct camelCase fields

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- backend/app/schemas/history.py: HistoryItem Pydantic model already defined with camelCase
- backend/app/schemas/grading.py: GradingResult, CategoryScore, HighlightRange already defined
- backend/app/models/base.py: SQLAlchemy Base class for model inheritance
- backend/app/models/user.py: User model with UUID primary key — FK target for submissions
- backend/app/services/grading.py: GradingService — auto-save logic integrates here or in the route
- backend/app/routes/grading.py: POST /api/grade route — needs to save result after inference

### Established Patterns
- Async SQLAlchemy sessions via dependency injection (database.py)
- APIRouter with /api prefix, mounted in main.py
- Auth protection via get_current_user dependency
- CamelModel base for all Pydantic response models
- Alembic migrations for schema changes
- pytest with httpx AsyncClient + SQLite for integration tests

### Integration Points
- backend/app/main.py: mount history router
- backend/app/routes/grading.py: add auto-save after GradingService.grade()
- backend/app/models/__init__.py: export Submission model
- backend/alembic/env.py: register Submission model for autogenerate

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-persistence-history*
*Context gathered: 2026-03-09*
