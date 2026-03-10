---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Onboarding & Layout Redesign
status: planning
stopped_at: null
last_updated: "2026-03-10T16:00:00.000Z"
last_activity: 2026-03-10 -- Roadmap created for v2.1 (Phases 16-18)
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages
**Current focus:** Phase 16 — Landing Page & Auth Entry

## Current Position

Phase: 16 of 18 (Landing Page & Auth Entry)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-03-10 — Roadmap created for v2.1 Onboarding & Layout Redesign

Progress: [░░░░░░░░░░] 0% (v2.1)

## Performance Metrics

**Velocity (from v1.0 + v1.1 + v2.0):**
- Total plans completed: 30
- Feature commits: 28+ (13 v1.0 + 15 v1.1 + v2.0)
- Total LOC: 2,541+ across 38+ files

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v2.1]: Grammarly-inspired landing page replaces combined home/grading page for unauthenticated users
- [v2.1]: Multi-step wizard for registration onboarding (grade level required, other steps skippable)
- [v2.0]: Real JWT auth in place -- v2.1 auth flows build on existing backend endpoints
- [Phase 15-01]: Persist essayText in app store so users don't lose essay on refresh
- [Phase 15-01]: Remove local history from app store entirely (backend is source of truth)
- [Phase 15-02]: Always use FormData for grading requests (backend Form() fields, not JSON body)

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 3 | Fix PDF upload formatting - extra blank lines between every line not preserving original structure | 2026-03-10 | 89ee416 | [3-fix-pdf-upload-formatting-extra-blank-li](./quick/3-fix-pdf-upload-formatting-extra-blank-li/) |
| 4 | Sign-in popup when unauthenticated user clicks Submit for Grading | 2026-03-10 | 72f4400 | [4-sign-in-popup-when-unauthenticated-user-](./quick/4-sign-in-popup-when-unauthenticated-user-/) |

## Session Continuity

Last session: 2026-03-10
Stopped at: Roadmap created for v2.1 milestone (Phases 16-18)
Resume file: None
