---
phase: 21-llm-powered-suggestion-popover
plan: 01
subsystem: api, ui
tags: [fastapi, pydantic, ollama, llm, tiptap, react, typescript, prosemirror]

# Dependency graph
requires:
  - phase: 20-languagetool-decorations
    provides: LTPopup component with decoration click handling, ltPluginKey, Harper.js WASM integration
  - phase: 13-llm-inference-grading
    provides: LLMClient protocol, get_llm_client factory, OllamaClient with JSON schema support

provides:
  - POST /api/suggestions endpoint returning LLM-generated explanation and fix suggestions
  - SuggestionRequest/SuggestionResponse Pydantic CamelModel schemas
  - Upgraded LTPopup with async loading/loaded/error states
  - fetchSuggestions() API client function
  - Stale response guard via currentFromRef pattern
  - Viewport-clamped popover positioning

affects:
  - grading-page
  - future-suggestion-tuning

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CamelModel pattern for Pydantic schemas with camelCase JSON serialization"
    - "FetchState discriminated union for async UI states (loading | loaded | error)"
    - "currentFromRef stale-response guard — track in-flight request by ProseMirror 'from' position"
    - "extractSentenceContext uses indexOf on plain text, NOT ProseMirror positions"
    - "Viewport clamping: flip above if anchorRect.bottom + popupHeight > window.innerHeight; clamp left with Math.min"

key-files:
  created:
    - backend/app/schemas/suggestions.py
    - backend/app/routes/suggestions.py
    - backend/tests/test_suggestions.py
    - src/api/suggestions.ts
  modified:
    - backend/app/main.py
    - src/components/grading/LTPopup.tsx

key-decisions:
  - "Safe fallback on malformed LLM JSON — return 200 with empty suggestions rather than 500 (better UX for students)"
  - "Error state falls back to Harper's original replacements rather than showing nothing"
  - "Stale response guard uses ProseMirror 'from' position as request identity key"
  - "extractSentenceContext uses plain text indexOf to avoid ProseMirror offset complexity"

patterns-established:
  - "FetchState discriminated union pattern: { status: 'loading' } | { status: 'loaded'; ... } | { status: 'error'; ... }"
  - "currentFromRef pattern for discarding stale async responses in click-triggered fetches"

requirements-completed: [GRAM-02]

# Metrics
duration: 12min
completed: 2026-03-13
---

# Phase 21 Plan 01: LLM-Powered Suggestion Popover Summary

**POST /api/suggestions endpoint with Ollama LLM integration + LTPopup upgraded with async loading/loaded/error states, stale-response guard, and viewport clamping**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-13T20:38:09Z
- **Completed:** 2026-03-13T20:50:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Backend POST /api/suggestions calls Ollama (llama3.2:3b) with concise grammar assistant system prompt + JSON schema enforcement
- 4 integration tests covering happy path, 401 auth, malformed JSON fallback, and 503 Ollama connection error
- LTPopup now shows loading spinner on click, then LLM explanation + suggestion buttons on success
- Error state falls back gracefully to Harper's original replacements
- Stale response guard via currentFromRef prevents race conditions when clicking issues rapidly
- Viewport clamping flips popup above anchor near bottom edge and clamps left at viewport edge

## Task Commits

Each task was committed atomically:

1. **[TDD RED] Test: POST /api/suggestions failing tests** - `20d0ed2` (test)
2. **[TDD GREEN] Feat: POST /api/suggestions endpoint** - `3eedccb` (feat)
3. **Task 2: Frontend async LTPopup with LLM suggestions** - `05056bc` (feat)

## Files Created/Modified
- `backend/app/schemas/suggestions.py` - SuggestionRequest and SuggestionResponse Pydantic CamelModel schemas
- `backend/app/routes/suggestions.py` - POST /api/suggestions with Ollama LLM call, auth guard, error handling
- `backend/app/main.py` - Registered suggestions.router in api_router
- `backend/tests/test_suggestions.py` - 4 integration tests (happy path, auth, malformed JSON, ConnectError)
- `src/api/suggestions.ts` - fetchSuggestions() using apiClient.post
- `src/components/grading/LTPopup.tsx` - Upgraded with FetchState, async UI, currentFromRef stale guard, viewport clamping

## Decisions Made
- **Safe fallback on malformed LLM JSON:** Returns 200 with `{ message: "Unable to generate suggestions", suggestions: [] }` rather than 500 — students still see the popup, not an error
- **Error UI falls back to Harper replacements:** When LLM is unavailable, existing Harper suggestions are still shown so the popup remains useful
- **Plain text indexOf for sentence extraction:** Used `editor.getText()` + `indexOf` to find sentence boundaries, avoiding ProseMirror position complexity (plan's Pitfall 2 guidance)
- **Non-null assertion `editor!.getText()`:** Used to satisfy TypeScript strict null check inside event callback closure where `editor` is guaranteed non-null by the effect guard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict null error on `editor.getText()` inside event callback**
- **Found during:** Task 2 (frontend build)
- **Issue:** TypeScript TS18047 error — `editor` typed as `Editor | null` is possibly null inside closure even though `if (!editor) return` guards the effect
- **Fix:** Changed `editor.getText()` to `editor!.getText()` — editor is guaranteed non-null at this call site by the effect guard
- **Files modified:** src/components/grading/LTPopup.tsx
- **Verification:** `npm run build` succeeds cleanly
- **Committed in:** 05056bc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript strict null in closure)
**Impact on plan:** Minor fix required for TypeScript compliance. No scope change.

## Issues Encountered
- TypeScript's strict null checking flagged `editor` inside event callback closure — resolved with non-null assertion since the effect guard makes it safe. Standard pattern for Tiptap event handlers.

## User Setup Required
None - no external service configuration required. LLM calls use existing Ollama configuration.

## Next Phase Readiness
- POST /api/suggestions is live and authenticated; clicking any underlined word triggers the LLM lookup
- LTPopup handles all states cleanly with graceful fallback
- Ollama must be running locally with llama3.2:3b for suggestions to work (expected dev dependency)
- No blockers for subsequent phases

---
*Phase: 21-llm-powered-suggestion-popover*
*Completed: 2026-03-13*
