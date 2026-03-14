# Phase 21: LLM-Powered Suggestion Popover - Research

**Researched:** 2026-03-13
**Domain:** FastAPI endpoint design + React async popover state
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep Harper.js for detection + underlines (fast WASM-based, instant feedback)
- LLM suggestions fetched on-demand when user clicks an underline (not batch/preloaded)
- New backend endpoint POST /api/suggestions using existing Ollama client infrastructure
- No fallback needed for Ollama being unavailable — it's always running
- POST /api/suggestions accepts: sentence context, flagged text, category (grammar/spelling/style)
- Returns: message (explanation) and suggestions array
- Uses existing Ollama client (llama3.2:3b) with a focused grammar-assistant system prompt
- Uses existing Ollama HTTP client at backend/app/llm/ollama.py
- On underline click: show popover with loading spinner
- Fetch from /api/suggestions with sentence + flagged text from Harper's decoration data attributes
- Display LLM-generated message and clickable suggestions
- Click suggestion → replace text in editor, close popover
- Dismiss button removes underline for that occurrence
- Viewport-aware positioning (shadcn/ui Popover or similar)

### Claude's Discretion
- Exact system prompt wording for the grammar assistant
- Loading spinner design/animation
- Popover component choice (shadcn Popover vs custom)
- How to extract sentence context around the flagged text
- Whether endpoint requires auth or is open

### Deferred Ideas (OUT OF SCOPE)
- Caching LLM responses for repeated identical issues
- Batch pre-fetching suggestions in background after lint completes
- Fallback to Harper suggestions when Ollama is unavailable
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAM-02 | User can click an underlined issue to see suggestions and apply a fix or ignore it | Full stack: backend POST /api/suggestions endpoint + LTPopup.tsx async state upgrade |
</phase_requirements>

---

## Summary

Phase 21 replaces Harper's low-quality built-in suggestions with LLM-generated explanations and fixes. The infrastructure is almost entirely in place: Harper decorations already store all needed data attributes (`data-lt-message`, `data-lt-replacements`, `data-lt-from`, `data-lt-to`, `data-lt-category`), the LTPopup component already renders and handles clicks, and the OllamaClient already handles structured JSON output. The work is surgical: (1) add a `POST /api/suggestions` route, (2) extend `LTPopup` to fetch from that endpoint and show a loading state while awaiting the response.

The key design question is whether the suggestions endpoint requires auth. Given the existing pattern (all user-scoped endpoints require JWT via `get_current_user`) and that the editor is only accessible to logged-in users anyway, requiring auth is consistent with the codebase. The `apiClient` (axios) already adds the Bearer token automatically, so no extra frontend work is needed.

The sentence-context extraction is the main piece of new logic. The LTPopup already has the underlined span's ProseMirror `from`/`to` positions, but the Ollama call needs surrounding sentence text for context. The best approach is to extract the full sentence from the editor text using the `from`/`to` positions — walk backward to the previous `.` or `\n\n` and forward to the next `.` or `\n\n`, with a cap of ~200 chars to keep the prompt tight.

**Primary recommendation:** One backend route + one frontend async-state upgrade. Reuse all existing infrastructure — no new libraries required.

---

## Standard Stack

### Core (all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.135.x | New `/api/suggestions` route | Already used for all routes |
| Pydantic (via CamelModel) | 2.x | Request/response validation with camelCase aliases | Already established pattern |
| OllamaClient | existing | JSON-schema-validated LLM call | Already handles structured output |
| React (useState, useEffect) | 18/19 | Async loading state in LTPopup | Already used |
| axios (apiClient) | existing | Fetch suggestions from frontend | Interceptor already adds auth |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | existing | Popover card shell (already in LTPopup) | Keep existing card structure |
| lucide-react Loader2 | existing (in project) | Spinning loading indicator | Use `animate-spin` Tailwind class |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom fixed-position popup (current) | shadcn/ui Popover | shadcn Popover uses Radix Portal + floating-ui for auto-placement; current manual fixed positioning works and viewport clamping can be added inline — no dependency needed |
| Auth required | Open endpoint | Consistent with all other routes; frontend already sends token unconditionally |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
backend/app/
├── routes/
│   └── suggestions.py     # NEW: POST /api/suggestions
├── schemas/
│   └── suggestions.py     # NEW: SuggestionRequest / SuggestionResponse
├── llm/
│   └── ollama.py          # UNCHANGED — used directly
└── main.py                # CHANGE: include_router(suggestions.router)

src/
├── api/
│   └── suggestions.ts     # NEW: fetchSuggestions(req) -> SuggestionResponse
├── components/grading/
│   └── LTPopup.tsx        # CHANGE: add loading state + LLM fetch on click
```

### Pattern 1: Backend Route Following Grading Route Convention

**What:** New route module in `routes/`, schema module in `schemas/`, registered in `main.py`.
**When to use:** All new API endpoints follow this convention.

```python
# backend/app/routes/suggestions.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.llm.client import get_llm_client
from app.models.user import User
from app.schemas.suggestions import SuggestionRequest, SuggestionResponse

router = APIRouter(tags=["suggestions"])

@router.post("/suggestions", response_model=SuggestionResponse)
async def get_suggestions(
    body: SuggestionRequest,
    user: User = Depends(get_current_user),
) -> SuggestionResponse:
    settings = get_settings()
    llm = get_llm_client(settings)
    raw = await llm.complete(SYSTEM_PROMPT, build_user_prompt(body), SUGGESTION_SCHEMA)
    # parse raw JSON into SuggestionResponse
    ...
```

### Pattern 2: Pydantic Schema with CamelModel

**What:** Request and response models extend `CamelModel` for automatic camelCase aliases.
**When to use:** All API schemas in the project use this.

```python
# backend/app/schemas/suggestions.py
from .base import CamelModel

class SuggestionRequest(CamelModel):
    flagged_text: str      # serializes as flaggedText
    sentence_context: str  # serializes as sentenceContext
    category: str          # "grammar" | "spelling" | "style"

class SuggestionResponse(CamelModel):
    message: str
    suggestions: list[str]
```

### Pattern 3: OllamaClient JSON Schema Validation

**What:** Pass a `json_schema` dict to `ollama.complete()` to get structured output.
**When to use:** Any time a guaranteed-shape response is needed (already used for grading).

```python
SUGGESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "suggestions": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["message", "suggestions"]
}
```

The `temperature` is set to `0.3` automatically when `json_schema` is provided (see `ollama.py` line 47).

### Pattern 4: Async State in LTPopup

**What:** Extend `PopupData` to include loading/loaded/error states. Fetch kicks off when a new decoration is clicked.
**When to use:** The popup is already a controlled component with `useState<PopupData | null>`.

```typescript
// LTPopup.tsx additions
type FetchState =
  | { status: 'loading' }
  | { status: 'loaded'; message: string; suggestions: string[] }
  | { status: 'error'; message: string }

// State alongside existing popupData:
const [fetchState, setFetchState] = useState<FetchState | null>(null)

// On decoration click — after setPopupData():
setFetchState({ status: 'loading' })
fetchSuggestions({ flaggedText, sentenceContext, category })
  .then(data => setFetchState({ status: 'loaded', ...data }))
  .catch(() => setFetchState({ status: 'error', message: 'Could not load suggestions' }))
```

### Pattern 5: Sentence Context Extraction

**What:** Extract the sentence containing the flagged span from editor text.
**When to use:** Needed to give Ollama enough context about the flagged word's usage.

```typescript
function extractSentenceContext(
  editorText: string,
  from: number,
  to: number,
  maxLen = 200
): string {
  // Walk backward from `from` to sentence boundary
  let start = from
  while (start > 0 && !/[.!?\n]/.test(editorText[start - 1])) start--
  // Walk forward from `to` to sentence boundary
  let end = to
  while (end < editorText.length && !/[.!?\n]/.test(editorText[end])) end++
  const sentence = editorText.slice(start, end + 1).trim()
  // Cap length for prompt efficiency
  if (sentence.length > maxLen) {
    return sentence.slice(0, maxLen) + '...'
  }
  return sentence
}
```

Note: ProseMirror `from`/`to` positions are already stored as `data-lt-from` / `data-lt-to` on decorations. However, these are ProseMirror document positions, not character offsets in `editor.getText()`. The editor text is obtained via `editor.getText({ blockSeparator: '\n\n' })` — the same method used by `LanguageTool.ts` for linting. A clean approach: in the `handleEditorClick` handler, also call `editor.getText({ blockSeparator: '\n\n' })` to get the plain text, then use the Harper span's character offset. The decoration already stores `data-lt-from` as a ProseMirror position; the character offset is not directly stored. The simplest approach for context: use the flagged text itself plus up to N characters before/after it in the plain editor text, or just send `flaggedText` and a broader `sentenceContext` extracted from the editor's plain text around that position.

### Pattern 6: Frontend API Function

**What:** A typed function in `src/api/suggestions.ts` that wraps `apiClient.post`.
**When to use:** Matches existing pattern in `src/api/grading.ts`.

```typescript
// src/api/suggestions.ts
import { apiClient } from './client'

export interface SuggestionRequest {
  flaggedText: string
  sentenceContext: string
  category: string
}

export interface SuggestionResponse {
  message: string
  suggestions: string[]
}

export async function fetchSuggestions(
  req: SuggestionRequest
): Promise<SuggestionResponse> {
  const { data } = await apiClient.post<SuggestionResponse>('/suggestions', req)
  return data
}
```

### Anti-Patterns to Avoid

- **Firing the fetch before click — pre-loading:** Context says on-demand only. No background prefetch.
- **Replacing `popupData.message` with LLM message:** Keep the original Harper message as fallback during loading. Render Harper's message while loading, then replace with LLM message once loaded.
- **Mixing ProseMirror positions with character offsets:** `data-lt-from`/`data-lt-to` are PM positions, not text character positions. For sentence extraction, use `editor.getText()` and find the flagged text by string search if needed — don't assume PM positions map directly to char offsets.
- **Blocking the close/dismiss behavior during loading:** If the user dismisses while loading, cancel the pending state update. Use a ref to track the current request's `from` position; ignore stale responses.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-structured LLM output | Custom JSON parsing with regex | `ollama.complete(sys, user, json_schema)` | Already enforces schema via Ollama's `response_format.schema` |
| Request/response serialization | Manual dict construction | `CamelModel` Pydantic schemas | camelCase aliases handled automatically |
| Auth on new endpoint | Separate auth logic | `Depends(get_current_user)` | Already handles 401 for all protected routes |
| Axios auth header | Custom fetch with token | `apiClient.post(...)` | Interceptor already injects Bearer token |

**Key insight:** The entire infrastructure exists. The planner should treat this as plumbing work — connecting existing pieces with minimal new code.

---

## Common Pitfalls

### Pitfall 1: Stale Fetch Response After Quick Popup Close/Reopen

**What goes wrong:** User clicks underline A (fetch starts), then immediately clicks underline B. Response from A arrives and overwrites B's popup content.
**Why it happens:** Async fetch does not know if the popup it was fetched for is still the current one.
**How to avoid:** Store the `from` position of the in-flight request. In the `.then()` handler, check that `popupData?.from` still matches the requested `from`. If not, discard the response.
**Warning signs:** Popup shows suggestions for wrong word.

### Pitfall 2: ProseMirror Position vs. Text Character Offset Confusion

**What goes wrong:** `data-lt-from` is a ProseMirror document position (includes node boundaries), not a plain text character index. Using it directly as an index into `editor.getText()` will be off.
**Why it happens:** Tiptap decorations use PM positions; Harper lints use text offsets. The `buildOffsetMap` in `LanguageTool.ts` converts between them at decoration creation time but does not store both.
**How to avoid:** For sentence context extraction, use `editor.getText()` and locate the flagged text by searching for `data-lt-message`'s associated span text content, or use the DOM `textContent` of the clicked span directly as `flaggedText` (most reliable). For broader sentence context, take `±150 chars` around the span's text content in `editor.getText()`.
**Warning signs:** Sentence context passed to LLM starts mid-word or is empty.

### Pitfall 3: 502/503 Error Handling in Popup

**What goes wrong:** If Ollama is slow or returns an error, the loading spinner spins forever.
**Why it happens:** The `OllamaClient` retries once on `ConnectError`/`TimeoutException` (line 49 in `ollama.py`) then raises — the FastAPI route must catch this and return a structured 502/503. The frontend must catch the error and set `fetchState` to `error`.
**How to avoid:** Wrap the `llm.complete()` call in `try/except httpx.ConnectError, httpx.TimeoutException` in the route, returning HTTP 503. In the frontend `.catch()`, set `fetchState = { status: 'error', message: 'Suggestions unavailable' }` and render a short error message in the popup instead of suggestions.
**Warning signs:** Popup stuck in loading state indefinitely.

### Pitfall 4: Loading State Shown After Popup Is Dismissed

**What goes wrong:** User dismisses popup, then the in-flight fetch completes and re-shows popup or throws a React state update on unmounted component warning.
**Why it happens:** `setFetchState` is called unconditionally in `.then()`.
**How to avoid:** `LTPopup` does not unmount (it renders null when `popupData === null`) so no "unmounted" error, but the state update should still be guarded: check `if (currentFromRef.current === requestedFrom)` before calling `setFetchState`.

### Pitfall 5: Ollama JSON Schema Compliance for Small Models

**What goes wrong:** `llama3.2:3b` is a small model and may occasionally not follow the JSON schema perfectly even with `response_format.schema`. The `complete()` call returns raw JSON string — if it's malformed, `json.loads()` in Python will raise.
**Why it happens:** Small models can fail to close JSON brackets or include extra text.
**How to avoid:** Wrap `json.loads(raw)` in a `try/except ValueError` and return a safe fallback `SuggestionResponse(message="Unable to generate suggestions", suggestions=[])` rather than a 500 error.

---

## Code Examples

Verified patterns from the existing codebase:

### Registering a New Route in main.py

```python
# Source: backend/app/main.py (existing pattern)
from .routes import auth, grading, health, history, suggestions  # add suggestions

api_router.include_router(suggestions.router)
```

### OllamaClient Structured Call

```python
# Source: backend/app/llm/ollama.py
raw_json = await llm.complete(
    system_prompt=SYSTEM_PROMPT,
    user_prompt=f"Flagged text: \"{body.flagged_text}\"\nContext: \"{body.sentence_context}\"\nCategory: {body.category}",
    json_schema=SUGGESTION_SCHEMA,
)
# raw_json is a string; parse with json.loads()
```

### LTPopup Click Handler Pattern (existing)

```typescript
// Source: src/components/grading/LTPopup.tsx lines 53-70
const decoration = target.closest('[data-lt-message]') as HTMLElement | null
if (decoration) {
  const message = decoration.getAttribute('data-lt-message') ?? ''
  const flaggedText = decoration.textContent ?? ''   // span's DOM text = the flagged word(s)
  // ... setPopupData(...) then fire fetch
}
```

### Dismiss Removes Decoration (existing)

```typescript
// Source: src/components/grading/LTPopup.tsx lines 165-175
const decos = pluginState.find(from, to)
const newSet = pluginState.remove(decos)
editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, newSet))
```

### Replace Text in Editor (existing)

```typescript
// Source: src/components/grading/LTPopup.tsx lines 151-163
editor.chain().focus().command(({ tr }) => {
  tr.replaceWith(from, to, editor.state.schema.text(replacement))
  return true
}).run()
```

---

## System Prompt Recommendation

The grammar-assistant prompt should be focused and terse to work well with `llama3.2:3b`:

```
You are a grammar assistant. Given a flagged text issue in an essay, explain the problem briefly and suggest 1-3 specific corrections.

Rules:
- Explanation must be 1 sentence, max 20 words
- Suggestions must be exact replacement text (the corrected version of the flagged text only)
- Return 1-3 suggestions, ordered best-first
- Do not include the surrounding sentence in suggestions — only the replacement for the flagged text

Respond in JSON with keys: "message" (string) and "suggestions" (array of strings).
```

This prompt is deliberately short because `llama3.2:3b` performs better with concise instructions. The JSON schema enforcement via Ollama's `response_format.schema` handles structure compliance.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LanguageTool API (remote) | Harper.js WASM (local) | Phase 16 (2026-03-13) | No network round-trip for detection; suggestions were LanguageTool's |
| LanguageTool built-in suggestions | LLM-generated suggestions | Phase 21 (this phase) | Context-aware, readable explanations |
| Static popup (data from Harper) | Async popup (data from Ollama) | Phase 21 (this phase) | Loading state needed |

**Deprecated/outdated:**
- `data-lt-replacements` on decorations: Harper stores these from `lint.suggestions()`. They will be displayed as fallback during loading or ignored entirely once LLM suggestions arrive. The attribute is still written by `LanguageTool.ts` and can remain.

---

## Open Questions

1. **Should the endpoint require auth?**
   - What we know: All existing user-scoped endpoints use `get_current_user`. The editor is only accessible to logged-in users.
   - What's unclear: Is there any reason to make `/api/suggestions` open (no JWT)?
   - Recommendation: Require auth via `Depends(get_current_user)` for consistency. Frontend already sends token automatically.

2. **How to reliably extract sentence context from the editor?**
   - What we know: `decoration.textContent` gives the exact flagged text. `editor.getText({ blockSeparator: '\n\n' })` gives the full plain text. ProseMirror positions are available in `data-lt-from` / `data-lt-to`.
   - What's unclear: Whether PM positions are safe to use as char offsets in editor text.
   - Recommendation: Use `decoration.textContent` for `flaggedText`. For `sentenceContext`, call `editor.getText()` in the click handler and find the flagged text's position using `indexOf`. This avoids PM position mapping entirely.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio 9.x |
| Config file | `backend/pyproject.toml` (`asyncio_mode = "auto"`) |
| Quick run command | `cd backend && uv run pytest tests/test_suggestions.py -x` |
| Full suite command | `cd backend && uv run pytest tests/ -x` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAM-02 | POST /api/suggestions returns message + suggestions for valid input | integration | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_returns_message_and_suggestions -x` | Wave 0 |
| GRAM-02 | POST /api/suggestions returns 401 without auth | integration | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_requires_auth -x` | Wave 0 |
| GRAM-02 | POST /api/suggestions handles malformed LLM JSON gracefully | unit | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_handles_bad_llm_json -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && uv run pytest tests/test_suggestions.py -x`
- **Per wave merge:** `cd backend && uv run pytest tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/test_suggestions.py` — covers all GRAM-02 test cases above
- [ ] Fixtures for mocking `OllamaClient.complete` already available via `unittest.mock.AsyncMock` (no new conftest entries needed)

---

## Sources

### Primary (HIGH confidence)

- Codebase direct read — `backend/app/llm/ollama.py`: OllamaClient API, JSON schema, temperature, retry behavior
- Codebase direct read — `backend/app/routes/grading.py`: Route convention, auth dependency pattern
- Codebase direct read — `backend/app/schemas/base.py`: CamelModel pattern
- Codebase direct read — `src/extensions/LanguageTool.ts`: Decoration attributes, plugin key, `data-lt-*` shape
- Codebase direct read — `src/components/grading/LTPopup.tsx`: Full current popup implementation, replace + dismiss patterns
- Codebase direct read — `src/api/client.ts`: apiClient axios config + interceptors
- Codebase direct read — `backend/app/main.py`: Router registration pattern
- Codebase direct read — `backend/tests/conftest.py`: Test infrastructure (in-memory SQLite, async client)

### Secondary (MEDIUM confidence)

- CONTEXT.md (21-CONTEXT.md): User locked decisions and discretion areas
- STATE.md: Accumulated decisions about PM decoration pattern, one-way sync

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Architecture: HIGH — verified by reading all relevant files directly
- Pitfalls: HIGH — identified from actual code patterns (PM position vs char offset, stale fetch)
- System prompt: MEDIUM — `llama3.2:3b` behavior is empirical; prompt may need tuning

**Research date:** 2026-03-13
**Valid until:** 2026-04-12 (stable domain, all verified from codebase)
