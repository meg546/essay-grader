# Phase 7: Data Contracts & Route Restructure - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Prepare the app's data layer and navigation for all v1.1 features. This includes: adding highlight range data to mock API responses (HLGT-01), consolidating navigation to two tabs (NAV-01, NAV-02), and removing the 960px layout constraint to unblock side-by-side results.

</domain>

<decisions>
## Implementation Decisions

### Highlight Data Shape
- One highlight range per feedback point (each strength/improvement gets its own highlight)
- Character offsets (start, end) into the raw essay text string
- Overlapping highlights allowed — same passage can relate to multiple categories
- Each highlight includes a type field: 'strength' or 'improvement'
- Each highlight carries categoryId linking it to the parent rubric category

### Route Consolidation
- Replace root route (/) with GradingPage — the combined home/grading page becomes the app root
- Delete LandingPage component entirely — Phase 8 builds the hero fresh within grading page
- Remove /grade route entirely (no redirect) — dev project, no real users with bookmarks
- Final routes: / (GradingPage) and /profile (ProfilePage)

### Layout Width
- Remove max-w-[960px] entirely from both Layout main area and Header
- Content goes full-width with padding — side-by-side layout in Phase 9 manages its own constraints
- Header also goes full-width (consistent with content area)

### Navigation
- Two tabs only: Home and Profile
- Always-visible tabs on mobile — remove hamburger/Sheet menu (2 tabs don't need it)
- Keep left-aligned branding (EssayGrader + icon) with tabs on the right
- Home tab stays active for entire grading workflow (input, loading, results all at /)

### Claude's Discretion
- Horizontal padding amount for full-width layout (currently px-4)
- Exact structure of the highlight TypeScript interfaces
- How mock highlight data maps to the existing mock essay text

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CategoryScore` interface (src/api/types.ts): Existing per-category structure — highlights attach here
- `GradingResult` interface (src/api/types.ts): Top-level result type that needs highlight data added
- `mockGradingResult` (src/api/mock-data.ts): Mock data that needs highlight ranges added with realistic character offsets
- `NavLinkItem` component (src/components/layout/Header.tsx): Reusable nav link with active state detection

### Established Patterns
- Zustand for state management — highlight state should follow same pattern if needed
- Mock data behind typed async API functions — highlights follow this contract
- React Router v7 for routing — route changes are straightforward

### Integration Points
- `Header.tsx` navItems array: Change from 3 items to 2 (remove Grade)
- `Header.tsx`: Remove Sheet/hamburger mobile menu, show tabs always
- `Layout.tsx` main element: Remove max-w-[960px]
- `Header.tsx` inner div: Remove max-w-[960px]
- `App.tsx` Routes: Remove /grade route, move GradingPage to /, delete LandingPage import
- `src/api/types.ts`: Add highlight range types
- `src/api/mock-data.ts`: Add highlight data to mock results

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the data contract and route changes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-data-contracts-route-restructure*
*Context gathered: 2026-03-08*
