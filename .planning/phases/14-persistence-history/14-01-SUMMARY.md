---
phase: 14-persistence-history
plan: 01
subsystem: database
tags: [sqlalchemy, alembic, postgresql, json, orm]

# Dependency graph
requires:
  - phase: 13-llm-inference-grading
    provides: POST /api/grade endpoint and GradingResult schema
  - phase: 11-backend-skeleton
    provides: SQLAlchemy Base, User model, Alembic setup
provides:
  - Submission ORM model with 11 columns
  - Auto-save integration in POST /api/grade
  - Alembic migration for submissions table
affects: [14-02-history-endpoints, 15-frontend-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [auto-save after inference, denormalized columns for list queries, JSON column for full result storage]

key-files:
  created:
    - backend/app/models/submission.py
    - backend/alembic/versions/b3c7e9a12d45_add_submissions_table.py
  modified:
    - backend/app/models/__init__.py
    - backend/alembic/env.py
    - backend/app/routes/grading.py
    - backend/tests/test_grading.py

key-decisions:
  - "Used sqlalchemy.JSON instead of JSONB for SQLite test compatibility"
  - "Manual Alembic migration (Docker PostgreSQL not up to date for autogenerate)"
  - "Auto-save in route layer (not service layer) to keep GradingService pure"

patterns-established:
  - "Auto-save pattern: persist after inference, set result.id from DB record"
  - "Denormalized columns: extract frequently-queried fields from JSON for list performance"

requirements-completed: [PERSIST-01]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 14 Plan 01: Submission Model & Auto-Save Summary

**Submission ORM model with denormalized columns and auto-save integration in POST /api/grade endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T00:09:29Z
- **Completed:** 2026-03-10T00:11:35Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Submission model with 11 columns including JSON result storage and denormalized query fields
- Composite index on (user_id, graded_at) for efficient history list queries
- Auto-save in grading route persists every result immediately after LLM inference
- TDD: failing test written first, then implementation, all 8 grading tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Submission model, register in __init__ and Alembic** - `6fce301` (feat)
2. **Task 2 RED: Add failing test for submission auto-save** - `7d3b597` (test)
3. **Task 2 GREEN: Add auto-save to grading route** - `aa15fa0` (feat)

## Files Created/Modified
- `backend/app/models/submission.py` - Submission ORM model with 11 columns and composite index
- `backend/alembic/versions/b3c7e9a12d45_add_submissions_table.py` - Migration for submissions table
- `backend/app/models/__init__.py` - Export Submission model
- `backend/alembic/env.py` - Register Submission for autogenerate
- `backend/app/routes/grading.py` - Auto-save logic after LLM inference
- `backend/tests/test_grading.py` - New test_grade_saves_submission test

## Decisions Made
- Used sqlalchemy.JSON instead of JSONB for SQLite test compatibility (consistent with Phase 11-02 decision on dialect-agnostic types)
- Created manual Alembic migration since Docker PostgreSQL was not up to date for autogenerate (following Phase 11-02 precedent)
- Placed auto-save logic in route layer rather than service layer to keep GradingService as a pure inference orchestrator

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Submission model and auto-save ready for history endpoints (14-02)
- GET /api/history, GET /api/history/:id, DELETE /api/history/:id can query the submissions table
- test_session_factory available for history endpoint tests

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.

---
*Phase: 14-persistence-history*
*Completed: 2026-03-10*
