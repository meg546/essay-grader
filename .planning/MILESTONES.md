# Milestones

## v1.0 MVP (Shipped: 2026-03-08)

**Phases:** 1-6 (6 phases, 6 plans)
**Delivered:** Full essay grading app with input, rubric editing, submission flow, results display, history, and E2E tests.

## v1.1 UX Redesign (Shipped: 2026-03-09)

**Phases:** 7-10 (4 phases, 7 plans)
**Timeline:** 2 days (Mar 8-9, 2026)
**Stats:** 15 feature commits, 19 files changed, +859/-177 lines, 2,541 LOC total
**Git range:** `feat(07-02)` → `feat(10-02)`

**Key accomplishments:**
1. Highlight data contracts — HighlightRange types with 17 mock highlight ranges enabling passage-level feedback
2. Collapsible hero section — Animated hero (motion library) that collapses on essay focus for seamless single-page flow
3. Side-by-side results layout — Split-pane grid (essay left, feedback right) with responsive vertical stacking <1024px
4. Color-coded essay highlighting — Category-colored mark elements, toggleable legend, bidirectional hover, click-to-scroll
5. Mock authentication — Email+password sign-in with validation, async delay, and auth-gated profile content
6. In-place essay editing — Edit/re-grade loop without navigation, loading overlay on feedback panel

## v2.0 Backend Implementation (Shipped: 2026-03-10)

**Phases:** 11-15 (5 phases, 12 plans)
**Delivered:** Full Python/FastAPI backend with JWT auth, LLM grading pipeline, PostgreSQL persistence, and frontend integration replacing all mock data.

## v2.1 Onboarding & Layout Redesign (In Progress)

**Phases:** 16-18 (3 phases)
**Goal:** Grammarly-inspired landing page, multi-step registration wizard, and profile settings for user preferences.

---
