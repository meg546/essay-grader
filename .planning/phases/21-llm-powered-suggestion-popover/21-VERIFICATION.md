---
phase: 21-llm-powered-suggestion-popover
verified: 2026-03-13T21:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 21: LLM-Powered Suggestion Popover Verification Report

**Phase Goal:** When clicking grammar/spelling underlines, fetch context-aware explanations and fix suggestions from local Ollama model instead of Harper's built-in suggestions
**Verified:** 2026-03-13T21:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clicking an underlined issue opens a popover showing a loading spinner, then an LLM-generated explanation and fix suggestions | VERIFIED | `LTPopup.tsx` line 92-109: `setFetchState({ status: 'loading' })` set immediately on decoration click; `.then(data => setFetchState({ status: 'loaded', ... }))` wired to `fetchSuggestions()`; loading branch renders `<Loader2 animate-spin>` with "Getting suggestions..." text (lines 274-281) |
| 2 | Clicking a suggestion replaces the flagged text in the editor and closes the popover | VERIFIED | `handleReplace()` (lines 196-210) calls `editor.chain().command(tr.replaceWith(from, to, ...))` then `setPopupData(null); setFetchState(null); currentFromRef.current = null`; loaded state renders suggestion buttons with `onClick={() => handleReplace(s)}` (line 291) |
| 3 | Dismissing an issue removes the underline and the issue does not reappear until text changes | VERIFIED | `handleDismiss()` (lines 212-224) calls `ltPluginKey.getState()`, removes the decoration from the `DecorationSet` via `pluginState.remove(decos)`, dispatches `tr.setMeta(ltPluginKey, newSet)` to update ProseMirror state |
| 4 | Popover stays within the visible viewport near top/bottom edges | VERIFIED | Lines 233-239: flips above anchor when `anchorRect.bottom + 4 + 200 > window.innerHeight`; clamps left with `Math.min(anchorRect.left, window.innerWidth - 288 - 8)` |
| 5 | POST /api/suggestions returns an explanation and suggestions array for flagged text | VERIFIED | `routes/suggestions.py` line 36-68: authenticated `POST /suggestions` endpoint calls `llm.complete()` with system prompt + JSON schema, parses response, returns `SuggestionResponse`; all 4 tests pass (4/4) |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/app/schemas/suggestions.py` | SuggestionRequest and SuggestionResponse Pydantic models | VERIFIED | Contains `class SuggestionRequest(CamelModel)` with `flagged_text`, `sentence_context`, `category`; `class SuggestionResponse(CamelModel)` with `message`, `suggestions: list[str]`; 12 lines, substantive |
| `backend/app/routes/suggestions.py` | POST /api/suggestions endpoint with Ollama LLM call | VERIFIED | Exports `router`; `@router.post("/suggestions", response_model=SuggestionResponse)`; calls `llm.complete()` with system prompt + JSON schema; handles 503 (ConnectError/TimeoutException) and safe fallback (ValueError/KeyError/TypeError) |
| `backend/tests/test_suggestions.py` | Integration tests for suggestions endpoint | VERIFIED | 4 tests: happy path (200), auth required (401), malformed JSON fallback (200 + empty suggestions), ConnectError (503); all 4 PASS confirmed by live test run |
| `src/api/suggestions.ts` | Frontend API client for suggestions endpoint | VERIFIED | Exports `fetchSuggestions(req: SuggestionRequest): Promise<SuggestionResponse>` using `apiClient.post('/suggestions', req)` |
| `src/components/grading/LTPopup.tsx` | Async popover with loading/loaded/error states | VERIFIED | Contains `FetchState` discriminated union (line 18-21); `fetchState` state variable (line 60); full conditional rendering for loading/loaded/error/null states (lines 274-336); stale-response guard via `currentFromRef` (lines 62, 92, 101, 106) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/grading/LTPopup.tsx` | `src/api/suggestions.ts` | `fetchSuggestions()` call on decoration click | WIRED | `import { fetchSuggestions } from '@/api/suggestions'` (line 7); called at line 99 inside `handleEditorClick` after decoration click |
| `src/api/suggestions.ts` | `/api/suggestions` | `apiClient.post` | WIRED | Line 15: `apiClient.post<SuggestionResponse>('/suggestions', req)` — uses the axios client with `/api` base URL |
| `backend/app/routes/suggestions.py` | `backend/app/llm/client.py` | `get_llm_client + complete()` | WIRED | Line 43: `llm = get_llm_client(settings)`; line 52: `await llm.complete(system_prompt=..., user_prompt=..., json_schema=...)` |
| `backend/app/main.py` | `backend/app/routes/suggestions.py` | `include_router` | WIRED | Line 5: `from .routes import auth, grading, health, history, suggestions`; line 24: `api_router.include_router(suggestions.router)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GRAM-02 | 21-01-PLAN.md | User can click an underlined issue to see suggestions and apply a fix or ignore it | SATISFIED | Full async LLM popover implemented: click opens loading state -> LLM suggestions load -> clicking suggestion applies fix via `handleReplace()` -> dismiss removes underline via `ltPluginKey` decoration removal; REQUIREMENTS.md marks Phase 21 as Complete for GRAM-02 |

No orphaned requirements — GRAM-02 is the only ID mapped to Phase 21 in REQUIREMENTS.md traceability table (line 189).

### Anti-Patterns Found

None. Scanned all 4 created/modified phase files for TODO/FIXME/XXX/HACK/PLACEHOLDER comments, empty return bodies, and stub implementations. No issues found.

### Human Verification Required

#### 1. Loading Spinner Timing

**Test:** Open grading page, type a word with a grammar or spelling error (e.g., "I recieve the package"), wait for the underline to appear, then click the underlined word.
**Expected:** Popover opens immediately showing Harper's original generic message plus a spinner with "Getting suggestions..." — then, once the Ollama call completes, the spinner is replaced by the LLM-generated explanation and suggestion buttons.
**Why human:** Cannot verify Ollama response latency or the visual transition from loading to loaded state programmatically.

#### 2. Stale Response Guard (Rapid Clicking)

**Test:** Click one underlined word immediately followed by clicking a different underlined word before the first LLM response returns.
**Expected:** Only the second word's LLM response appears in the popover — the first response is silently discarded.
**Why human:** The `currentFromRef` guard logic is correct in code but race condition behavior requires runtime observation.

#### 3. Error State Fallback Display

**Test:** Stop the Ollama server (`pkill ollama`), then click an underlined issue.
**Expected:** Popover shows "Suggestions unavailable" in muted text, then falls back to showing Harper's original replacement suggestions (if any exist) as clickable buttons.
**Why human:** Cannot simulate Ollama being unavailable without stopping the server process.

#### 4. Viewport Clamping Near Bottom Edge

**Test:** Scroll the editor so an underlined word is near the bottom of the visible viewport (within 200px of the window bottom), then click it.
**Expected:** Popover flips to appear above the underlined word rather than below it, keeping it fully visible.
**Why human:** Requires browser rendering to observe the flip behavior.

### Gaps Summary

No gaps. All 5 must-have truths verified, all 5 artifacts confirmed as substantive and wired, all 4 key links confirmed active. GRAM-02 is fully satisfied. The 4 tests in `test_suggestions.py` pass (confirmed by live run), and TypeScript compiles cleanly (confirmed by `npx tsc --noEmit` with no output). All three documented commit hashes (`20d0ed2`, `3eedccb`, `05056bc`) exist in git history.

---

_Verified: 2026-03-13T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
