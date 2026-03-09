# Phase 8: Collapsible Hero & Grading Workspace - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a hero section to the combined home/grading page (GradingPage at /) that collapses when the user starts working. Creates a seamless single-page flow from landing welcome to grading workspace. The hero replaces the deleted LandingPage from Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Hero Content & Appearance
- Title + one-line tagline only (e.g., "EssayGrader" + "AI-powered essay feedback in seconds")
- Medium banner height (~150-200px) — grading inputs visible without scrolling
- Same background as workspace — no gradient or tinted background, just whitespace separation
- Centered text alignment

### Collapse Trigger & Behavior
- Triggered only by essay textarea focus — no other interactions trigger collapse
- Hero hides entirely when collapsed — header already shows branding, so a minimal bar would be redundant
- Stays collapsed until reset — "Grade Another" click or page reload brings it back
- If essay text already exists (from Zustand persistence), hero starts collapsed — returning users go straight to work

### Collapse Animation
- Use Motion (framer-motion) library for animations
- Smooth slide up (~300ms) on collapse
- Symmetrical slide down to reveal on re-appear (reset)
- Workspace content smoothly shifts up in sync with hero collapse (AnimatePresence layout animation)

### Grading Workspace Layout
- Keep existing 2-column grid (essay left, rubric right) with submit button below
- Constrain workspace width (~1200px max) to prevent overly wide inputs on large monitors — centered within full-width page
- Remove the "Grade Essay" heading — hero title replaces it, and inputs are self-explanatory when hero is collapsed

### Claude's Discretion
- Exact tagline wording
- Motion animation configuration (spring vs tween, exact duration/easing)
- How to manage the collapsed state (React state, Zustand, or derived from essayText)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GradingPage` (src/pages/GradingPage.tsx): Current home page component — hero section will be added here
- `EssayInput` (src/components/grading/EssayInput.tsx): Essay textarea component — needs onFocus callback for collapse trigger
- `RubricUpload` (src/components/grading/RubricUpload.tsx): Rubric upload component — unchanged
- `useAppStore` (src/stores/app-store.ts): Zustand store — `essayText` state can determine initial hero visibility

### Established Patterns
- Zustand for state management — hero collapsed state could use same pattern or local React state
- Full-width layout (Layout.tsx has no max-width) — workspace constrains itself
- Two-tab header with always-visible nav — no changes needed in Header

### Integration Points
- `GradingPage.tsx`: Primary modification target — add hero section, wire collapse state
- `EssayInput.tsx`: Needs to expose/accept an onFocus prop to trigger hero collapse
- `package.json`: Add `motion` (framer-motion) dependency

</code_context>

<specifics>
## Specific Ideas

- QuillBot AI Detector style inspiration — clean input area with minimal chrome above it
- Hero should feel like a "welcome mat" that gets out of the way once you start working

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-collapsible-hero-grading-workspace*
*Context gathered: 2026-03-08*
