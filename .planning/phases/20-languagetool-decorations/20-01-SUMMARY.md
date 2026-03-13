---
phase: 20-languagetool-decorations
plan: "01"
subsystem: api
tags: [languagetool, grammar, fastapi, typescript, fetch, httpx, proxy]

requires:
  - phase: 19-tiptap-editor-foundation
    provides: Tiptap editor accepting essay text that Phase 20 decorations will annotate

provides:
  - checkText() function in src/api/languagetool.ts with CORS fallback and 429 retry
  - LTMatch and LTResponse TypeScript interfaces
  - FastAPI proxy at POST /api/languagetool/check forwarding to public LT API
  - 3 passing backend tests covering success, upstream failure, and 429 forwarding

affects:
  - 20-02-languagetool-decorations (decoration extension consumes checkText())
  - 21-highlight-sync (uses offset/length from LTMatch for ProseMirror positions)

tech-stack:
  added: []
  patterns:
    - "Frontend fetch with CORS fallback: try LT_PUBLIC first, catch network error and retry via LT_PROXY"
    - "429 exponential backoff in _checkText() helper: 10s/20s/40s, returns [] after 3 retries"
    - "FastAPI proxy forwards raw body + Content-Type header, returns upstream JSON or 503 empty matches"

key-files:
  created:
    - src/api/languagetool.ts
    - backend/app/routes/languagetool.py
    - backend/tests/test_languagetool.py
  modified:
    - backend/app/main.py

key-decisions:
  - "Default LanguageTool level (not picky) per research recommendation — avoids noise from over-sensitive rules"
  - "httpx.HTTPError base class caught in proxy (not ConnectError alone) to cover timeout and all network failures"

patterns-established:
  - "API client pattern: thin TypeScript module, named exports, no thrown errors (silently returns [])"
  - "Proxy pattern: FastAPI route reads raw body, forwards with same Content-Type, returns upstream status code"

requirements-completed: [GRAM-01]

duration: 2min
completed: 2026-03-13
---

# Phase 20 Plan 01: LanguageTool API Layer Summary

**Native fetch wrapper with CORS fallback and 429 exponential backoff, plus FastAPI proxy forwarding to the public LanguageTool API**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T20:03:28Z
- **Completed:** 2026-03-13T20:05:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `checkText()` exported from `src/api/languagetool.ts` — calls public LT API, falls back to proxy on CORS/network error, handles 429 with backoff, never throws
- FastAPI proxy registered at `POST /api/languagetool/check` — forwards raw body, returns upstream JSON or 503 on httpx failure
- 3 backend tests green: success forward, upstream failure (503), and 429 forwarding

## Task Commits

1. **Task 1: Create LanguageTool API client and FastAPI proxy** - `4d0183c` (feat)
2. **Task 2: Backend proxy tests** - `cd45075` (test)

## Files Created/Modified

- `src/api/languagetool.ts` - checkText() with CORS fallback + 429 retry; exports LTMatch, LTResponse
- `backend/app/routes/languagetool.py` - FastAPI proxy route forwarding to LT upstream
- `backend/app/main.py` - Added languagetool router registration
- `backend/tests/test_languagetool.py` - 3 pytest tests for proxy success/failure/429

## Decisions Made

- Default LanguageTool level (not picky) — research recommended avoiding the picky level to reduce noise
- Caught `httpx.HTTPError` base class in proxy (broader than `ConnectError`) to handle timeouts and all network-level failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `checkText()` ready for consumption by the ProseMirror decoration extension (Plan 02)
- LTMatch offset/length fields provide the raw data for position mapping
- FastAPI proxy available as automatic CORS fallback — no browser config needed
- Blocker: LanguageTool CORS must still be verified in browser (still an open concern for Plan 02)

---
*Phase: 20-languagetool-decorations*
*Completed: 2026-03-13*

## Self-Check: PASSED

All files found and both task commits verified on disk.
