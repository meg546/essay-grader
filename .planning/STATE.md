---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: Live Essay Feedback
status: planning
stopped_at: "Completed 23-01-PLAN.md: Writing timer data layer"
last_updated: "2026-03-14T02:22:01.607Z"
last_activity: "2026-03-13 - Completed quick task 16: Replace LanguageTool with Harper.js WASM"
progress:
  total_phases: 23
  completed_phases: 13
  total_plans: 29
  completed_plans: 27
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages
**Current focus:** Phase 19 — Tiptap Editor Foundation

## Current Position

Phase: 19 of 23 (Tiptap Editor Foundation)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-13 - Completed quick task 16: Replace LanguageTool with Harper.js WASM

Progress: [██████████░░░░░░░░░░] ~78% overall (18/23 phases complete)

## Performance Metrics

**Velocity (v1.0 through v2.1):**
- Total plans completed: 30+
- Phases complete: 18
- Total LOC: 2,541+ across 38+ files

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v2.2]: Tiptap v3 chosen for editor — best React ecosystem, headless, `immediatelyRender: false` required for React 19
- [v2.2]: One-way Zustand sync only — editor.getText() → store on `onUpdate`; store never writes back to editor after mount
- [v2.2]: All @tiptap/* packages must be pinned to same minor version (3.20.x) — mismatched versions cause silent plugin failures
- [v2.2]: Decorations must live in ProseMirror plugin state (not React state) — avoids flicker and cursor displacement
- [v2.2]: LanguageTool CORS confirmed via curl but must verify in browser during Phase 20 — FastAPI proxy ready as fallback
- [v2.2]: Heuristics deferred from v2.2 scope (moved to Future Requirements in REQUIREMENTS.md)
- [Phase 19-tiptap-editor-foundation]: getState().setEssayText in onUpdate avoids stale closure (Pitfall 3); setOptions per-render keeps textSize class reactive
- [Phase 19-tiptap-editor-foundation]: Removed essayText and onUploadEssayFile from GradingToolbar — toolbar uses EssayUploadModal internally, props were unused
- [Phase 19-tiptap-editor-foundation]: loadContent placed after useEditor in EssayInput to avoid TypeScript block-scoped-before-declaration error (TS2448/TS2454)
- [Phase 20-languagetool-decorations]: Default LanguageTool level (not picky) — avoids noise from over-sensitive rules
- [Phase 21-llm-powered-suggestion-popover]: Safe fallback on malformed LLM JSON — return 200 with empty suggestions rather than 500
- [Phase 21-llm-powered-suggestion-popover]: FetchState discriminated union + currentFromRef stale-response guard pattern for async popover
- [Phase 21-llm-powered-suggestion-popover]: extractSentenceContext uses plain text indexOf (not ProseMirror positions) to avoid offset complexity
- [Phase 23-writing-timer-file-upload]: Store absolute epoch ms (timerEndTime) rather than decrementing counter — survives page reloads accurately
- [Phase 23-writing-timer-file-upload]: useAppStore.getState() inside interval callback avoids stale closure on timerEndTime
- [Phase 23-writing-timer-file-upload]: Expired timer cleared silently on mount (no toast) when tab was closed during countdown

### Pending Todos

None.

### Blockers/Concerns

- [Phase 20]: LanguageTool CORS must be verified in the browser early — have FastAPI proxy plan ready if direct fetch fails
- [Phase 20]: ProseMirror position offset mapping is highest implementation risk — validate with unit test before building Phase 21 on top

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 15 | Implement Grammarly-like popup for LanguageTool suggestions | 2026-03-13 | 4846ed8 | [15-implement-grammarly-like-popup-for-langu](./quick/15-implement-grammarly-like-popup-for-langu/) |
| 16 | Replace LanguageTool with Harper.js WASM | 2026-03-13 | 593b599 | [16-replace-languagetool-with-harper-js-wasm](./quick/16-replace-languagetool-with-harper-js-wasm/) |
| Phase 21-llm-powered-suggestion-popover P01 | 12 | 2 tasks | 6 files |
| Phase 23-writing-timer-file-upload P01 | 2 | 2 tasks | 3 files |

## Session Continuity

Last session: 2026-03-14T02:22:01.603Z
Stopped at: Completed 23-01-PLAN.md: Writing timer data layer
Resume file: None
