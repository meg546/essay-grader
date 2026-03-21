---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Local Model Fine-Tuning
status: complete
stopped_at: ""
last_updated: "2026-03-21"
last_activity: "2026-03-21 - All v3.0 phases (24-28) complete"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages
**Current focus:** Milestone v3.0 — Local Model Fine-Tuning (complete)

## Current Position

Phase: All 5 phases complete (24-28)
Plan: —
Status: Milestone complete
Last activity: 2026-03-21 — All v3.0 phases implemented

Progress: [████████████████████] 100%

## Performance Metrics

**Velocity (v1.0 through v3.0):**
- Total plans completed: 35+
- Phases complete: 23+
- Training pipeline: 6 scripts, 1 backend improvement

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v2.2]: Tiptap v3 chosen for editor — best React ecosystem, headless, `immediatelyRender: false` required for React 19
- [v2.2]: One-way Zustand sync only — editor.getText() → store on `onUpdate`; store never writes back to editor after mount
- [v2.2]: Decorations must live in ProseMirror plugin state (not React state) — avoids flicker and cursor displacement
- [v2.2]: Heuristics deferred from v2.2 scope (moved to Future Requirements in REQUIREMENTS.md)
- [v3.0]: Qwen 2.5 chosen as base model — best structured JSON output among small models, Unsloth supports it natively
- [v3.0]: Multi-rubric augmentation with 4 rubric formats (4-cat, holistic 6pt, simplified 3-cat, analytical 5-trait) — prevents overfitting to one rubric shape
- [v3.0]: LoRA rank 64 for attention (q/k/v/o_proj), alpha=128 — higher rank improves exact-quote copying from context
- [v3.0]: Fuzzy matching threshold raised to 0.85 (from 0.6) with coarse-then-fine two-stage search — reduces false positive matches while catching near-exact quotes
- [v3.0]: Human score calibration in distillation prompt — tells Sonnet the ASAP holistic score so generated per-category scores align with human assessment
- [v3.0]: 500 training examples as default sample size (~$17 Sonnet cost) — sufficient for narrow structured-output task

### Pending Todos

None.

### Blockers/Concerns

- Running the pipeline requires: Kaggle API credentials, Anthropic API key, NVIDIA GPU (RTX 4090), and Ollama installed

## Session Continuity

Last session: 2026-03-21
Stopped at: v3.0 milestone complete — all scripts built, highlights improved, tests passing
Resume file: None
