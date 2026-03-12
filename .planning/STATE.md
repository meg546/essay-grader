---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: Live Essay Feedback
status: planning
stopped_at: Completed 19-tiptap-editor-foundation 19-01-PLAN.md
last_updated: "2026-03-12T17:01:27.766Z"
last_activity: 2026-03-12 — Roadmap created for v2.2 (Phases 19-23)
progress:
  total_phases: 23
  completed_phases: 12
  total_plans: 23
  completed_plans: 23
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
Last activity: 2026-03-12 — Roadmap created for v2.2 (Phases 19-23)

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

### Pending Todos

None.

### Blockers/Concerns

- [Phase 20]: LanguageTool CORS must be verified in the browser early — have FastAPI proxy plan ready if direct fetch fails
- [Phase 20]: ProseMirror position offset mapping is highest implementation risk — validate with unit test before building Phase 21 on top

## Session Continuity

Last session: 2026-03-12T17:01:27.763Z
Stopped at: Completed 19-tiptap-editor-foundation 19-01-PLAN.md
Resume file: None
