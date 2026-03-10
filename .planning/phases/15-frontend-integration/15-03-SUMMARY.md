---
phase: 15-frontend-integration
plan: 03
subsystem: api
tags: [ollama, openai, json-schema, highlights, grading]

requires:
  - phase: 13-llm-inference-grading
    provides: LLM client interface, compute_highlights, GradingService
provides:
  - Schema-enforced structured output for Ollama and OpenAI providers
  - Flat-format normalization that preserves quotes array
  - Diagnostic logging for empty quotes in compute_highlights
affects: [15-frontend-integration]

tech-stack:
  added: []
  patterns: [json_schema response_format for structured LLM output]

key-files:
  created: []
  modified:
    - backend/app/llm/ollama.py
    - backend/app/llm/openai.py
    - backend/app/services/grading.py
    - backend/app/llm/highlights.py
    - backend/tests/test_grading_service.py
    - backend/tests/test_highlights.py

key-decisions:
  - "Ollama uses response_format.schema (its OpenAI-compat structured output field)"
  - "OpenAI uses json_schema response_format type with strict=False for flexibility"
  - "Alt quote key normalization checks highlighted_passages, evidence_quotes, evidence"

patterns-established:
  - "Schema enforcement: always pass json_schema to LLM clients for structured output"
  - "Defensive normalization: check alternative key names before defaulting to empty"

requirements-completed: [FRONT-01]

duration: 8min
completed: 2026-03-10
---

# Phase 15 Plan 03: Highlights Bug Fix Summary

**Fixed two compounding backend bugs preventing highlights: LLM schema enforcement for Ollama/OpenAI and flat-format quotes normalization**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T02:21:42Z
- **Completed:** 2026-03-10T02:27:00Z
- **Tasks:** 2 of 2 (1 auto + 1 human-verify)
- **Files modified:** 6

## Accomplishments
- Ollama client now passes JSON schema via response_format.schema for structured output enforcement
- OpenAI client now uses json_schema response_format type instead of plain json_object
- Flat-format normalization ensures quotes key exists on every category, checking alternative key names
- compute_highlights logs diagnostic warning when category has empty quotes array
- 3 new tests covering flat-format quotes preservation and empty quotes warning
- All 80 backend tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests** - `fcfb77e` (test)
2. **Task 1 (GREEN): Fix LLM clients and normalization** - `689fbc0` (feat)

_TDD task: RED commit (failing tests) then GREEN commit (implementation)_

## Files Created/Modified
- `backend/app/llm/ollama.py` - Pass json_schema to Ollama via response_format.schema
- `backend/app/llm/openai.py` - Use json_schema response_format type for structured output
- `backend/app/services/grading.py` - Add quotes normalization in flat-format handler
- `backend/app/llm/highlights.py` - Add diagnostic warning logging for empty quotes
- `backend/tests/test_grading_service.py` - Tests for flat-format quotes and alt key normalization
- `backend/tests/test_highlights.py` - Test for empty quotes warning log

## Decisions Made
- Used Ollama's `response_format.schema` field (OpenAI-compat structured output)
- Used OpenAI's `json_schema` response_format type with `strict: False` to allow flexible schemas
- Check three alternative key names for quotes: highlighted_passages, evidence_quotes, evidence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification Results

**Task 2 (checkpoint:human-verify): APPROVED**

Playwright browser testing confirmed highlights rendering correctly:
- 4-5 colored highlight marks rendered on essay text
- Blue (Thesis), Orange (Organization), Purple (Evidence), and Teal (Language) highlights visible
- All highlights positioned correctly on quoted passages
- UAT Test 3 gap is closed

## Next Phase Readiness
- All tasks complete -- highlights bug fix fully verified end-to-end
- All backend code changes are committed and tested

---
*Phase: 15-frontend-integration*
*Completed: 2026-03-10*

## Self-Check: PASSED
