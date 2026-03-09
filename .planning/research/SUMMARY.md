# Research Summary: AI Essay Grader v1.1 UX Redesign

**Domain:** Educational technology frontend -- essay grading with inline feedback
**Researched:** 2026-03-08
**Overall confidence:** HIGH

## Executive Summary

The v1.1 milestone adds four capabilities to the existing essay grading app: a side-by-side results layout (essay left, feedback right), always-on color-coded text highlighting linked to feedback categories, a collapsible hero section (QuillBot-style), and mock email+password authentication.

The most significant finding is that zero new dependencies are required. The existing stack -- React 19, Tailwind CSS v4, Base UI Collapsible, tw-animate-css, Zustand with persist middleware, and shadcn-generated form components -- covers every new feature. This is a strong signal that the v1.0 stack choices were sound.

The most complex new feature is the text highlighting system, which requires a custom `<HighlightedText>` component that splits essay text into spans based on character offset ranges from the mock API. This is a ~50-line utility, not a library-level problem, but it needs careful handling of overlapping ranges and consistent color mapping to rubric categories. The mock API response schema must be designed to include highlight ranges before the UI work begins.

The collapsible hero and mock auth features are straightforward applications of existing primitives. The side-by-side layout is basic CSS Grid. The primary implementation risk is not technology but UX: getting the hero collapse timing right, ensuring highlighted text remains readable with multiple overlapping colors, and making the two-column layout work at tablet breakpoints.

## Key Findings

**Stack:** No new dependencies. All features covered by existing React 19 + Tailwind v4 + Base UI + Zustand + tw-animate-css stack.
**Architecture:** Text highlighting needs a utility function for splitting text into annotated spans, plus mock API schema changes to include highlight ranges. A scoped React context (not Zustand) should manage ephemeral hover-linking state between feedback cards and highlighted passages.
**Critical pitfall:** The current `max-w-[960px]` Layout container is too narrow for side-by-side results. This must be addressed first by moving width constraints from Layout into individual pages.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Layer + Route Restructure** - Mock API schema changes (add highlight ranges to GradingResult), type extensions, route consolidation (merge Home + Grade into single page), layout container width fix
   - Addresses: Highlight data contract, route merge, two-tab nav, layout width constraint
   - Avoids: Pitfall 1 (960px container too narrow), Pitfall 2 (highlight schema missing), Pitfall 11 (stale routes)

2. **Hero Section + Grading Workspace** - Collapsible hero with CSS animation, GradingWorkspace component managing input-to-results transition
   - Addresses: Collapsible hero, hero collapse state management
   - Avoids: Pitfall 4 (hero animation conflicts with state transitions), Pitfall 12 (CSS height:auto does not animate)

3. **Side-by-Side Results + Highlighting** - CSS Grid two-column layout, HighlightedEssay component, category-to-color mapping, HighlightContext for hover linkage
   - Addresses: Side-by-side layout, text highlighting, feedback-highlight visual linkage
   - Avoids: Pitfall 3 (overlapping highlights), Pitfall 5 (bad tablet breakpoint), Pitfall 8 (dark mode contrast)

4. **Mock Auth + Edit/Resubmit + Polish** - Sign-in form on profile, editable essay with view/edit toggle, scroll-to-highlight, final polish
   - Addresses: Mock authentication, editable essay resubmit, scroll sync (one-directional)
   - Avoids: Pitfall 7 (auth gating core grading), Pitfall 10 (contentEditable trap)

**Phase ordering rationale:**
- Data layer and route restructure must come first because everything else depends on the highlight data shape and the new combined page structure
- Hero section before results view because the hero lives on the combined page and its collapse behavior should work before overlaying the split-pane
- Side-by-side + highlighting is the core feature and the most complex work
- Auth and edit/resubmit are independent and lowest risk, grouped with polish

**Research flags for phases:**
- Phase 3 (highlighting): May need iteration on highlight color palette for dark mode contrast and overlapping range handling
- Phase 1 (route restructure): Verify all navigation paths after merge -- multiple components reference old route structure
- All other phases: Standard patterns, unlikely to need additional research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified in existing codebase; zero additions needed |
| Features | HIGH | Requirements clearly scoped in PROJECT.md; standard web UI patterns confirmed against Turnitin/Grammarly/QuillBot patterns |
| Architecture | HIGH | Span-based highlighting is well-understood; layout is CSS Grid; state management fits existing Zustand pattern |
| Pitfalls | HIGH | Derived from direct codebase analysis; specific files and line-level issues identified |

## Gaps to Address

- Color palette for highlight categories needs accessibility review (WCAG AA contrast ratios on highlighted text in both light and dark modes)
- Tablet breakpoint behavior for side-by-side layout needs a design decision: stack at `lg:` (1024px) is recommended
- Whether "editable essay in results view" means view/edit toggle (recommended) or inline contentEditable (rejected) -- toggle approach confirmed by architecture research
- Hero collapse trigger coordination with grading flow state machine -- derive from `essayText.length > 0 || currentResult !== null` rather than separate state
- localStorage size cap for history entries that now include full essay text + highlights (~20 entry limit recommended)
