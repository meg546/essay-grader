# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — UX Redesign

**Shipped:** 2026-03-09
**Phases:** 4 | **Plans:** 7 | **Sessions:** ~8

### What Was Built
- Highlight data contracts and 17 mock highlight ranges for passage-level feedback
- Collapsible hero section with motion animation for seamless single-page grading flow
- Side-by-side results layout with bidirectional hover, click-to-scroll, and category toggles
- Mock email+password authentication with validation and auth-gated profile content
- In-place essay editing with re-grade loop and loading overlay

### What Worked
- Wave-based parallel execution: Plans 10-01 and 10-02 ran simultaneously with zero file conflicts
- HighlightProvider context pattern: Clean separation of highlight state from rendering components, made bidirectional hover straightforward
- Phase 7 data contracts: Investing in types and mock data early made Phases 9 and 10 much smoother
- Cross-phase integration was seamless: scroll-target IDs, category colors, and highlight ranges all matched end-to-end

### What Was Inefficient
- Phase 8 SUMMARY.md missing `requirements_completed` frontmatter — caught during audit, had to note as documentation gap
- LAYOUT-02 wording mismatch: requirement said "minimal bar" but implementation hides hero entirely — required explanation note in verification
- No test framework: all verification was build-check + manual. Adding Vitest earlier would have enabled automated regression testing

### Patterns Established
- `HighlightProvider` with `key={result.id}` for clean re-mount on data change — prevents stale context state
- `buildSegments` utility for converting raw highlight ranges into ordered, overlap-safe rendering segments
- `partialize` in Zustand persist middleware to exclude transient loading state from persistence
- Bidirectional hover via shared context (activeCategoryId/activeHighlightId) instead of prop drilling

### Key Lessons
1. Invest in data contracts early — Phase 7's highlight types and mock data were consumed by 3 subsequent phases without modification
2. Always populate SUMMARY frontmatter fields — missing `requirements_completed` causes audit friction
3. HighlightProvider keying by result ID is essential for re-grade flows — without it, stale state persists across new results
4. Two independent features (auth + editable essay) on different pages parallelize perfectly — zero conflicts

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (research, execution, verification)
- Sessions: ~8 across 2 days
- Notable: 4 phases completed in 2 days, including full audit and integration verification

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 6 | Initial project setup with GSD workflow |
| v1.1 | ~8 | 4 | Parallel wave execution, cross-phase integration checking |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Playwright E2E | Manual | 0 |
| v1.1 | Build-check only | Manual | 1 (motion) |

### Top Lessons (Verified Across Milestones)

1. Data contracts and typed interfaces are the highest-leverage investment — used across both milestones
2. Mock-first development with realistic delays creates a smooth path to real backend integration
