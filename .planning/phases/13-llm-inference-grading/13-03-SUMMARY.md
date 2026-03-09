---
phase: 13-llm-inference-grading
plan: 03
subsystem: api
tags: [grading, pdf, pypdf, fastapi, multipart, endpoint, integration-tests]

# Dependency graph
requires:
  - phase: 13-llm-inference-grading
    provides: LLMClient Protocol, GradingService, prompt builders, highlight matching
provides:
  - PDF text extraction utility (extract_pdf_text)
  - POST /api/grade endpoint with multipart form handling
  - Integration tests for grading endpoint with mocked LLM
affects: [14-persistence, 15-frontend-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [Multipart form endpoint with text/PDF dual input, inline LLM client instantiation]

key-files:
  created:
    - backend/app/llm/pdf.py
    - backend/app/routes/grading.py
    - backend/tests/test_pdf.py
    - backend/tests/test_grading.py
  modified:
    - backend/app/main.py

key-decisions:
  - "Route instantiates LLM client inline via get_llm_client(get_settings()) for simplicity"
  - "Tests mock get_llm_client at route module level for deterministic integration testing"

patterns-established:
  - "Multipart form endpoint pattern: Form() for text fields, File() for uploads"
  - "Integration test pattern: register user, get token, mock LLM, test endpoint"

requirements-completed: [GRADE-01, PDF-01, PDF-02]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 13 Plan 03: Grading Endpoint & PDF Extraction Summary

**POST /api/grade endpoint accepting essay/rubric as text or PDF with pypdf extraction, auth-protected, 11 tests (4 unit + 7 integration)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T23:31:44Z
- **Completed:** 2026-03-09T23:34:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PDF text extraction utility with 10 MB size limit and minimum text validation
- POST /api/grade endpoint accepting multipart form with text/PDF essay and rubric inputs
- Auth-protected endpoint returning full GradingResult JSON with camelCase keys
- 11 tests total: 4 unit tests for PDF extraction, 7 integration tests for grading endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: PDF text extraction utility with tests** - `8b00351` (feat)
2. **Task 2: POST /api/grade route, router mounting, and integration tests** - `43b3d30` (feat)

## Files Created/Modified
- `backend/app/llm/pdf.py` - PDF text extraction using pypdf with size/content validation
- `backend/app/routes/grading.py` - POST /api/grade endpoint with multipart form handling
- `backend/app/main.py` - Added grading router to api_router
- `backend/tests/test_pdf.py` - 4 unit tests for PDF extraction (valid, oversized, insufficient, corrupt)
- `backend/tests/test_grading.py` - 7 integration tests covering auth, text input, PDF upload, grade levels

## Decisions Made
- Route instantiates LLM client inline via get_llm_client(get_settings()) rather than using FastAPI dependency injection -- simpler and testable via monkeypatch
- Tests mock get_llm_client at route module level for deterministic integration testing without real LLM
- TokenResponse uses snake_case (BaseModel not CamelModel), so tests use access_token key

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed auth token key in tests**
- **Found during:** Task 2 (integration tests)
- **Issue:** Tests expected camelCase "accessToken" but TokenResponse uses BaseModel (snake_case "access_token")
- **Fix:** Changed test helper to use resp.json()["access_token"]
- **Files modified:** backend/tests/test_grading.py
- **Verification:** All 7 integration tests pass

**2. [Rule 1 - Bug] Fixed register request payload in tests**
- **Found during:** Task 2 (integration tests)
- **Issue:** Tests sent full_name field but RegisterRequest only accepts email and password
- **Fix:** Removed full_name from register request, simplified to register-only flow
- **Files modified:** backend/tests/test_grading.py
- **Verification:** All 7 integration tests pass

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were test-code corrections to match existing API contracts. No scope creep.

## Issues Encountered
None beyond the test fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full grading API endpoint wired and tested
- All 65 tests pass across the entire backend test suite (zero regressions)
- Ready for persistence layer (Phase 14) and frontend integration (Phase 15)

---
*Phase: 13-llm-inference-grading*
*Completed: 2026-03-09*
