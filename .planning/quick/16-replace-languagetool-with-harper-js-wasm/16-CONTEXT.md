# Quick Task 16: Replace LanguageTool with Harper.js WASM - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Task Boundary

Replace the LanguageTool API-based grammar checker with Harper.js (WASM, runs in-browser via Web Worker). This eliminates network latency entirely, reducing check time from ~3-5 seconds to <10ms.

</domain>

<decisions>
## Implementation Decisions

### Harper.js API Surface (from docs)
- `WorkerLinter` — recommended for interactive apps (runs WASM in Web Worker, non-blocking)
- `linter.lint(text)` → `Promise<Lint[]>`
- `lint.message()` → human-readable error description
- `lint.span()` → `{ start: number, end: number }` (character offsets)
- `lint.lint_kind()` → string category (e.g., "Spelling", "Grammar")
- `lint.suggestions()` → `Suggestion[]`
- `suggestion.get_replacement_text()` → replacement string
- `linter.setLintConfig({ SpellCheck: true, ... })` for rule configuration

### What Changes
- Remove: `src/api/languagetool.ts` (API client), `backend/app/routes/languagetool.py` (proxy), backend tests
- Replace: `src/extensions/LanguageTool.ts` internals — swap API call for `WorkerLinter.lint()`
- Update: `LTPopup.tsx` data attribute reading to match new decoration data
- Update: Debounce from 3000ms to 300ms (Harper is <10ms, no network)
- Keep: Same decoration CSS classes, same popup component structure

### What Stays the Same
- ProseMirror decoration approach (inline decorations with data attributes)
- CSS underline styles (.lt-misspelling, .lt-grammar, .lt-style)
- LTPopup component (click to open, replacement chips, dismiss)
- Overall UX flow

</decisions>
