# Phase 21: LLM-Powered Suggestion Popover - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** Brainstorming session

<domain>
## Phase Boundary

This phase adds a click-to-fix popover on Harper.js underlines that fetches smart explanations and suggestions from a local Ollama model (llama3.2:3b) instead of using Harper's low-quality built-in suggestions. Harper continues to handle all detection and underline rendering.

</domain>

<decisions>
## Implementation Decisions

### Architecture
- Keep Harper.js for detection + underlines (fast WASM-based, instant feedback)
- LLM suggestions fetched on-demand when user clicks an underline (not batch/preloaded)
- New backend endpoint POST /api/suggestions using existing Ollama client infrastructure
- No fallback needed for Ollama being unavailable — it's always running

### Backend Endpoint
- POST /api/suggestions accepts: sentence context, flagged text, category (grammar/spelling/style)
- Returns: message (explanation) and suggestions array
- Uses existing Ollama client (llama3.2:3b) with a focused grammar-assistant system prompt
- Uses existing Ollama HTTP client at backend/app/llm/ollama.py

### Frontend Popup
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

</decisions>

<specifics>
## Specific Ideas

- Harper already stores data attributes on decorations: data-lt-message, data-lt-replacements, data-lt-from, data-lt-to, data-lt-category
- Existing Ollama client uses OpenAI-compatible /v1/chat/completions API with JSON schema validation
- The popup should replace Harper's generic messages like "It seems these words would go better together" with context-aware explanations like "'have s topped' should be 'have stopped' — the space splits the word incorrectly"

</specifics>

<deferred>
## Deferred Ideas

- Caching LLM responses for repeated identical issues
- Batch pre-fetching suggestions in background after lint completes
- Fallback to Harper suggestions when Ollama is unavailable

</deferred>

---

*Phase: 21-llm-powered-suggestion-popover*
*Context gathered: 2026-03-13 via brainstorming session*
