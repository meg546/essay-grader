# Phase 16: Landing Page & Auth Entry - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated landing page for unauthenticated users that communicates the product value and provides clear paths to sign in or register. Grading page moves behind auth. The onboarding wizard (Phase 17) and profile settings (Phase 18) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Landing Page Content & Layout
- Full marketing page with multiple sections: hero, feature highlights, how-it-works steps, animated walkthrough demo, and footer
- Hero section with headline, subtitle, and prominent CTA buttons (Sign In + Register)
- How-it-works section showing the 3-step flow (paste essay, add rubric, get feedback)
- Animated walkthrough demo showing the grading flow in action (auto-playing animation of essay submission and results)
- Simple footer with app name, copyright, and basic links
- Feature highlight layout is Claude's discretion (icon cards grid or alternating rows — Card component available)

### Auth Flow Behavior
- Sign In opens the existing SignInDialog as a modal overlay — user stays on landing page
- Register navigates to `/register` route (Phase 17 will build the wizard at this route)
- After successful sign-in via modal, redirect to `/grade`
- Authenticated users visiting root URL get instant redirect to `/grade` — no landing page flash
- GradingPage moves from `/` to `/grade` route

### Nav Header
- Landing page shows minimal header: logo + Sign In button only
- Authenticated pages keep the existing full nav header (Home, Profile)
- Landing page has its own layout variant or no standard Layout wrapper

### Visual Tone & Branding
- Grammarly-inspired layout patterns but with EssayGrader's own identity — not a clone
- Use existing Tailwind theme colors (bg-background, text-foreground, primary) — supports dark mode automatically
- Lucide icons only for feature sections — no external illustrations or assets
- Subtle scroll-triggered animations using motion/react (already in the project via GradingPage)

### Claude's Discretion
- Feature highlight layout style (cards grid vs alternating image+text rows)
- Exact animated walkthrough implementation approach
- How-it-works section visual treatment
- Footer content and layout details
- Spacing, typography scale, and responsive breakpoints

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SignInDialog` (src/components/auth/SignInDialog.tsx): Full login/register form with tab switching, error handling, loading states. Reuse directly for sign-in modal on landing.
- `HeroSection` (src/components/grading/HeroSection.tsx): Current hero with tagline + 3 feature chips. Will be replaced/evolved for the new landing page.
- `Button` component (src/components/ui/button.tsx): Existing button variants for CTAs
- `Card` component (src/components/ui/card.tsx): Available for feature highlight cards
- `motion/react` (Framer Motion): Already used in GradingPage for AnimatePresence animations

### Established Patterns
- Tailwind CSS with design tokens (bg-background, text-foreground, etc.)
- Lucide icons throughout the app
- Zustand stores for state (useProfileStore has isSignedIn, token)
- react-router for routing (BrowserRouter, Routes, Route)

### Integration Points
- `src/App.tsx`: Route definitions — need to add `/grade` and `/register` routes, change `/` to landing page
- `src/components/layout/Layout.tsx`: Wraps all pages with Header + Outlet — landing page needs different layout
- `src/stores/profile-store.ts`: `isSignedIn` state for redirect logic
- `src/components/layout/Header.tsx`: Currently shows Home + Profile nav — needs auth-aware variant

</code_context>

<specifics>
## Specific Ideas

- Grammarly-style landing with dedicated sections but using EssayGrader's existing design language
- Animated walkthrough should show the real grading flow (essay in → results out) to demonstrate the product value
- Minimal header on landing to keep focus on content and CTAs — full nav only after auth

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-landing-page-auth-entry*
*Context gathered: 2026-03-10*
