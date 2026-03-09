# Phase 11: Backend Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A running FastAPI server in Docker Compose with PostgreSQL, configured for the frontend to connect to. Includes project scaffold, Pydantic response models matching frontend TypeScript types, and Alembic migration setup. No auth, grading, or persistence logic — just the infrastructure shell.

</domain>

<decisions>
## Implementation Decisions

### Repository structure
- Monorepo: backend/ folder alongside existing frontend src/
- docker-compose.yml at repo root (orchestrates full project)
- Single .env at repo root for all config (DB URL, CORS origin, model endpoint)
- Flat app/ package layout: backend/app/ with models/, routes/, schemas/ subpackages, plus config.py, database.py, deps.py

### Dev workflow
- Hybrid development: PostgreSQL in Docker, FastAPI runs natively with `uvicorn app.main:app --reload`
- docker-compose.yml includes both a `db` service (for dev) and a full `backend` service (for demo/CI)
- uv for Python dependency management (pyproject.toml + uv.lock)
- Python 3.12 target

### Claude's Discretion
- Exact Alembic configuration and migration naming
- Pydantic model field ordering and validator details
- Docker health check implementation
- CORS middleware configuration details
- Initial test structure (if any)

</decisions>

<specifics>
## Specific Ideas

- Frontend types to match are in src/api/types.ts: GradingResult, CategoryScore, HighlightRange, HistoryItem, GradeEssayRequest
- API base URL is http://localhost:8000/api (already configured in frontend)
- pwdlib over passlib (passlib unmaintained) — for Phase 12 but dependency can be noted
- pypdf over PyMuPDF (AGPL license concern) — for Phase 13

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/api/types.ts: TypeScript interfaces (GradingResult, CategoryScore, HighlightRange, HistoryItem) — Pydantic schemas must produce identical camelCase JSON
- src/api/grading.ts: Mock grading function shows the request/response contract
- src/api/history.ts: Mock history endpoints show expected list/detail patterns

### Established Patterns
- All API responses use camelCase (JavaScript convention) — Pydantic models need alias_generator
- Frontend uses Axios with base URL http://localhost:8000/api
- Zustand stores persist to localStorage — backend must return compatible shapes

### Integration Points
- CORS must allow Vite dev server origin (likely http://localhost:5173)
- Frontend expects /api prefix on all endpoints
- GradingResult.id is a UUID string — backend should use UUID primary keys

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-backend-foundation*
*Context gathered: 2026-03-09*
