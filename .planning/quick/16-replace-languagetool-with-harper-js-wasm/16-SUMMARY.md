---
phase: quick-16
plan: "01"
subsystem: editor-grammar
tags: [harper.js, wasm, web-worker, grammar-checking, tiptap, prosemirror]
dependency_graph:
  requires: [quick-15-lt-popup, 20-01-languagetool-api-layer]
  provides: [inline-grammar-decorations, spelling-grammar-style-popup]
  affects: [src/extensions/LanguageTool.ts, src/components/grading/LTPopup.tsx]
tech_stack:
  added: ["harper.js@1.9.0 (WASM-based grammar checker via WorkerLinter)"]
  patterns: ["module-level WASM singleton", "Web Worker non-blocking lint", "normalized 3-category mapping"]
key_files:
  created: []
  modified:
    - src/extensions/LanguageTool.ts
    - src/components/grading/LTPopup.tsx
    - backend/app/main.py
    - package.json
  deleted:
    - src/api/languagetool.ts
    - backend/app/routes/languagetool.py
    - backend/tests/test_languagetool.py
decisions:
  - "WorkerLinter singleton created at module level, not per-check, to avoid WASM reload overhead"
  - "Harper lint.span() gives {start, end} directly — existing snapToWordBounds called with (start, end-start) length"
  - "Normalized categories to 3 values (spelling/grammar/style) in extension, simplified popup mapping accordingly"
metrics:
  duration: ~8 minutes
  completed: 2026-03-13
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
---

# Quick Task 16: Replace LanguageTool with Harper.js WASM Summary

**One-liner:** Replaced LanguageTool network API (3-5s latency) with Harper.js WorkerLinter running WASM in a Web Worker (<10ms, offline-capable), reduced debounce from 3000ms to 300ms for near-instant grammar feedback.

## What Was Built

Harper.js WASM-based grammar checking fully replaces the LanguageTool API integration. The `WorkerLinter` singleton runs in a dedicated Web Worker, preventing any UI blocking. Grammar errors are detected and decorated within ~300ms of a typing pause — down from 3-5 seconds of network round-trip.

The popup system was simplified: categories are normalized to three values (`spelling`, `grammar`, `style`) in the extension layer, so the popup's mapping functions collapse from multi-condition if-else chains to clean single-value checks.

All backend LanguageTool code (FastAPI proxy route + tests) was removed since no network requests are made.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install harper.js and rewrite LanguageTool extension | 3e35b27 | LanguageTool.ts, package.json, deleted languagetool.ts |
| 2 | Update LTPopup categories and remove backend code | 593b599 | LTPopup.tsx, main.py, deleted languagetool.py + tests |

## Deviations from Plan

None — plan executed exactly as written. The `eslint-disable` comments for `any` types were added as a minor quality measure since harper.js has no published TypeScript types for `Lint` and `Suggestion` objects.

## Verification Results

- `npx tsc --noEmit` — zero errors (both tasks)
- `python3 -c "from app.main import app"` — backend imports cleanly
- Zero `languagetool` references in `src/` or `backend/`

## Self-Check: PASSED

- [x] `src/extensions/LanguageTool.ts` — rewrites to WorkerLinter
- [x] `src/components/grading/LTPopup.tsx` — simplified 3-category mapping
- [x] `backend/app/main.py` — no languagetool import or router
- [x] `src/api/languagetool.ts` — deleted
- [x] `backend/app/routes/languagetool.py` — deleted
- [x] `backend/tests/test_languagetool.py` — deleted
- [x] Commits: 3e35b27, 593b599
