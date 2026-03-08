# Phase 1: Foundation & API Layer - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a React/TypeScript project with Vite, establish the visual design system, create typed mock API functions with simulated delays, set up routing between all four pages (landing, grading, results, history), and build a responsive layout shell. This is the foundation every subsequent phase builds on.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity & Color Palette
- Warm earthy tones: soft sage greens, warm grays, cream backgrounds
- Sage green as the primary accent color (blending Grammarly's clean feel with earthy warmth)
- Grammarly-inspired overall aesthetic — clean white interface with green accents and focused tool feel
- Clean functional polish — professional and consistent, but no over-investment in animations or micro-interactions
- System fonts (Inter/system stack) — no external font dependencies
- Rounded-lg/xl corners on cards and buttons — friendly, approachable feel
- CSS custom properties from day one to support dark mode in Phase 5 without refactoring

### UI Component Library
- shadcn/ui + Tailwind CSS
- Copy-paste components with full control and customization
- Customize shadcn default theme to match warm earthy palette

### Layout & Navigation
- Top bar with tab-style navigation (Landing, Grade, Results, History)
- Centered max-width content area (~900-1000px) — focused reading/writing feel like Grammarly
- At 768px tablet breakpoint: tabs collapse into hamburger/drawer menu
- Each placeholder page shows skeleton mockups (gray boxes suggesting future layout, not just titles)

### Claude's Discretion
- Header branding (app name with or without icon — whatever fits the design)
- Mock API data realism level and specific data shapes
- Exact spacing, shadows, and micro-interactions
- Router library choice (React Router or TanStack Router)
- State management setup (Zustand store structure)
- Error state handling approach

</decisions>

<specifics>
## Specific Ideas

- "I want it to feel like Grammarly" — clean white interface, green accents, focused writing tool aesthetic
- Warm earthy direction should soften Grammarly's clinical feel — cream instead of pure white, sage instead of Grammarly green
- Skeleton placeholders should hint at what each page will become (e.g., grading page shows textarea-shaped box + rubric-shaped boxes)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes all patterns for the project

### Integration Points
- This phase creates the foundation: routing, layout shell, design tokens, and API layer that all subsequent phases plug into

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-api-layer*
*Context gathered: 2026-03-08*
