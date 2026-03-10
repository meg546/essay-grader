# Phase 16: Landing Page & Auth Entry - Research

**Researched:** 2026-03-10
**Domain:** React landing page, routing, auth-gated redirects, scroll animations
**Confidence:** HIGH

## Summary

Phase 16 replaces the current combined home/grading page with a dedicated marketing landing page for unauthenticated users and moves the grading functionality behind authentication at `/grade`. The existing codebase already has all the building blocks: `react-router` v7 for routing, `motion/react` (Framer Motion) for animations, `SignInDialog` for the sign-in modal, `zustand` with persisted `isSignedIn` state, Tailwind CSS v4 with a warm cream/sage green theme, and shadcn UI components (Button, Card, Dialog).

The primary technical challenges are: (1) restructuring routes so `/` serves the landing page and `/grade` serves the grading page, (2) implementing auth-aware redirect logic that prevents landing page flash for authenticated users, (3) building a multi-section marketing page with scroll-triggered animations, and (4) creating a minimal landing-page header variant that only shows the logo and Sign In button.

**Primary recommendation:** Create a new `LandingPage` component with dedicated sections, add a `ProtectedRoute` wrapper for auth gating, restructure `App.tsx` routes to use two layout variants (landing layout vs authenticated layout), and reuse the existing `SignInDialog` for the sign-in modal.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full marketing page with multiple sections: hero, feature highlights, how-it-works steps, animated walkthrough demo, and footer
- Hero section with headline, subtitle, and prominent CTA buttons (Sign In + Register)
- How-it-works section showing the 3-step flow (paste essay, add rubric, get feedback)
- Animated walkthrough demo showing the grading flow in action (auto-playing animation of essay submission and results)
- Simple footer with app name, copyright, and basic links
- Sign In opens the existing SignInDialog as a modal overlay -- user stays on landing page
- Register navigates to `/register` route (Phase 17 will build the wizard at this route)
- After successful sign-in via modal, redirect to `/grade`
- Authenticated users visiting root URL get instant redirect to `/grade` -- no landing page flash
- GradingPage moves from `/` to `/grade` route
- Landing page shows minimal header: logo + Sign In button only
- Authenticated pages keep the existing full nav header (Home, Profile)
- Landing page has its own layout variant or no standard Layout wrapper
- Grammarly-inspired layout patterns but with EssayGrader's own identity -- not a clone
- Use existing Tailwind theme colors (bg-background, text-foreground, primary) -- supports dark mode automatically
- Lucide icons only for feature sections -- no external illustrations or assets
- Subtle scroll-triggered animations using motion/react (already in the project via GradingPage)

### Claude's Discretion
- Feature highlight layout style (cards grid vs alternating image+text rows)
- Exact animated walkthrough implementation approach
- How-it-works section visual treatment
- Footer content and layout details
- Spacing, typography scale, and responsive breakpoints

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | User sees a dedicated landing page with site info and feature highlights | New LandingPage component with hero, features, how-it-works, walkthrough, footer sections |
| LAND-02 | Landing page content includes Sign In and Register buttons (not in the nav banner) | Hero section CTA buttons: Sign In triggers SignInDialog modal, Register links to `/register` |
| LAND-03 | Landing page is separate from the grading page (grading requires auth) | Route restructuring: `/` = LandingPage, `/grade` = GradingPage behind ProtectedRoute |
| AUTH2-01 | User can sign in via the landing page Sign In button | Reuse existing SignInDialog component with onAuthenticated redirecting to `/grade` |
| AUTH2-02 | User can register via the landing page Register button | Register button navigates to `/register` (Phase 17 builds the wizard there) |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | ^7.13.1 | Routing, navigation, layout routes | Already used in App.tsx |
| motion/react | ^12.35.1 | Scroll animations, enter/exit transitions | Already used in GradingPage |
| zustand | ^5.0.11 | Auth state (isSignedIn, token) | Already used for profile store |
| lucide-react | ^0.577.0 | Icons for feature sections | Already used throughout |
| tailwindcss | ^4.2.1 | Styling with design tokens | Already the project CSS framework |
| shadcn components | v4.0.2 | Button, Card, Dialog | Already installed and used |

### No New Dependencies Required
This phase uses only existing libraries. No new packages to install.

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    LandingPage.tsx          # NEW - marketing landing page
    GradingPage.tsx           # EXISTING - moves to /grade route
    ProfilePage.tsx           # EXISTING - unchanged
  components/
    landing/
      HeroSection.tsx         # NEW - hero with headline + CTAs
      FeatureHighlights.tsx   # NEW - feature cards/rows
      HowItWorks.tsx          # NEW - 3-step flow section
      WalkthroughDemo.tsx     # NEW - animated grading demo
      Footer.tsx              # NEW - landing page footer
    layout/
      Layout.tsx              # MODIFY - authenticated layout (wraps /grade, /profile)
      LandingLayout.tsx       # NEW - minimal layout for landing page (logo + sign in only)
      Header.tsx              # MODIFY - update nav links (Home -> /grade)
    auth/
      ProtectedRoute.tsx      # NEW - redirects unauthenticated to /
      SignInDialog.tsx         # EXISTING - reused on landing page
  App.tsx                     # MODIFY - restructure routes
```

### Pattern 1: Route Structure with Dual Layouts
**What:** Two layout routes in App.tsx -- one for landing (minimal header), one for authenticated pages (full header)
**When to use:** When landing page needs a fundamentally different chrome than the app pages

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { Layout } from "@/components/layout/Layout"
import { LandingLayout } from "@/components/layout/LandingLayout"
import { LandingPage } from "@/pages/LandingPage"
import { GradingPage } from "@/pages/GradingPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page with minimal header */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Authenticated pages with full header */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/grade" element={<GradingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Phase 17 placeholder */}
        <Route path="/register" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Pattern 2: ProtectedRoute with Zustand
**What:** Route guard that checks `isSignedIn` from zustand store and redirects to landing
**When to use:** Wrapping any route that requires authentication

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router"
import { useProfileStore } from "@/stores/profile-store"

export function ProtectedRoute() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

### Pattern 3: Auth-Aware Landing Page Redirect
**What:** Landing page instantly redirects authenticated users to `/grade`
**When to use:** Preventing authenticated users from seeing the marketing page

```typescript
// Inside LandingPage component (top of component body)
import { useNavigate } from "react-router"
import { useProfileStore } from "@/stores/profile-store"

export function LandingPage() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)
  const navigate = useNavigate()

  useEffect(() => {
    if (isSignedIn) {
      navigate("/grade", { replace: true })
    }
  }, [isSignedIn, navigate])

  if (isSignedIn) return null // prevent flash

  // ... render landing page
}
```

**Important:** The `if (isSignedIn) return null` before the effect prevents a single frame of the landing page rendering while the navigate call is being processed. Zustand's persisted state loads synchronously from localStorage, so `isSignedIn` is available on first render.

### Pattern 4: Scroll-Triggered Animations with motion/react
**What:** Sections animate in as user scrolls down the landing page
**When to use:** Each landing page section should fade/slide in on scroll

```typescript
import { motion } from "motion/react"

// Reusable wrapper for scroll-triggered section animations
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
```

Key motion/react APIs for this phase:
- `whileInView` -- triggers animation when element enters viewport
- `viewport={{ once: true }}` -- only animate once (don't re-animate on scroll back up)
- `viewport={{ margin: "-100px" }}` -- trigger slightly before element is fully in view
- `staggerChildren` on parent + individual child variants for staggered card animations

### Pattern 5: LandingLayout (Minimal Header)
**What:** Separate layout for landing page with only logo + Sign In button
**When to use:** Landing page needs different chrome than authenticated pages

```typescript
// src/components/layout/LandingLayout.tsx
import { Outlet } from "react-router"
import { NavLink } from "react-router"
import { GraduationCapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <GraduationCapIcon className="size-5" />
            <span>EssayGrader</span>
          </NavLink>
          {/* Sign In button triggers dialog -- handled by landing page */}
          <Button variant="outline" size="sm" id="header-sign-in">
            Sign In
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
```

**Note:** The header Sign In button can either lift state to the layout or be handled entirely within LandingPage. Simplest approach: landing page manages SignInDialog state, and the header Sign In is part of the landing page itself (no separate layout header button needed). Or the landing page scrolls past the header, so no Sign In in the header -- just in the hero CTAs. The decision of whether the minimal header includes a Sign In button is covered in the locked decisions: "Landing page shows minimal header: logo + Sign In button only."

### Anti-Patterns to Avoid
- **Checking auth in every component:** Use ProtectedRoute wrapper at route level, not auth checks sprinkled in each page
- **Flash of wrong content:** Never render the landing page for a frame before redirecting -- check `isSignedIn` synchronously before first render (zustand persist loads from localStorage on init)
- **Duplicating SignInDialog logic:** Reuse the existing component, don't create a new sign-in form for the landing page
- **Absolute positioning for layout sections:** Use normal document flow with flexbox/grid for landing page sections -- absolute positioning breaks responsive layouts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll animations | Custom IntersectionObserver + CSS | `motion/react` `whileInView` | Handles timing, easing, viewport detection correctly |
| Auth state management | Custom React context | `useProfileStore` (zustand) | Already persisted, already has signIn/register methods |
| Route guarding | Manual redirect logic in each page | `ProtectedRoute` component wrapping `<Outlet>` | Single source of truth, DRY |
| Sign-in modal | New form on landing page | Existing `SignInDialog` component | Full login/register with error handling already built |
| Button styles | Custom styled divs | shadcn `Button` component | Consistent with rest of app, accessible |

**Key insight:** This phase is primarily a UI/routing restructure. Almost no new business logic is needed -- the auth system, state management, and UI components already exist.

## Common Pitfalls

### Pitfall 1: Landing Page Flash for Authenticated Users
**What goes wrong:** Authenticated user visits `/` and briefly sees the landing page before redirect
**Why it happens:** React effect runs after first render, causing one frame of landing content
**How to avoid:** Check `isSignedIn` synchronously before rendering. Zustand persist middleware with localStorage loads state synchronously on store creation, so `isSignedIn` is available immediately. Return `null` from LandingPage while `isSignedIn` is true.
**Warning signs:** Visible flicker when navigating to root as authenticated user

### Pitfall 2: Navigation Links Breaking After Route Change
**What goes wrong:** Existing links to `/` (in Header, ProfilePage history click) still point to landing page instead of grading page
**Why it happens:** GradingPage moved from `/` to `/grade` but internal links not updated
**How to avoid:** Grep for all `to="/"` and `navigate("/")` calls in the codebase and update to `/grade` where they refer to the grading page. Key files: `Header.tsx` (Home link), `ProfilePage.tsx` (history click navigates to `/`)
**Warning signs:** Clicking "Home" in nav takes authenticated user to landing page instead of grading page

### Pitfall 3: Register Button Routing Before Phase 17
**What goes wrong:** Register button navigates to `/register` but nothing exists there yet
**Why it happens:** Phase 17 builds the registration wizard at that route
**How to avoid:** Add a temporary `/register` route that either shows a placeholder or redirects. Best approach: have Register button on landing page open the SignInDialog switched to "register" tab as an interim, OR navigate to `/register` with a simple placeholder page. The CONTEXT.md says "Register navigates to `/register` route (Phase 17 will build the wizard at this route)" -- so create a minimal placeholder.
**Warning signs:** Users hitting 404 on `/register`

### Pitfall 4: Animated Walkthrough Performance
**What goes wrong:** Complex auto-playing animation causes jank or high CPU
**Why it happens:** Animating multiple elements simultaneously with layout recalculations
**How to avoid:** Use CSS transforms only (translate, scale, opacity) -- these are GPU-composited. Avoid animating width, height, or other layout-triggering properties. Use `motion/react` which defaults to transform-based animations.
**Warning signs:** Page scroll stutter, high CPU in dev tools performance tab

### Pitfall 5: Dark Mode Inconsistency on Landing Page
**What goes wrong:** Landing page sections use hardcoded colors that don't respect dark mode
**Why it happens:** Using raw color values instead of Tailwind design tokens
**How to avoid:** Exclusively use semantic token classes: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`. The existing CSS variables handle light/dark automatically.
**Warning signs:** Sections look wrong when toggling dark mode

## Code Examples

### Landing Page Sign-In Flow
```typescript
// In LandingPage.tsx
const [showSignIn, setShowSignIn] = useState(false)
const navigate = useNavigate()

function handleAuthenticated() {
  setShowSignIn(false)
  navigate("/grade", { replace: true })
}

// In JSX:
<Button size="lg" onClick={() => setShowSignIn(true)}>Sign In</Button>
<Button size="lg" variant="outline" onClick={() => navigate("/register")}>Register</Button>

<SignInDialog
  open={showSignIn}
  onOpenChange={setShowSignIn}
  onAuthenticated={handleAuthenticated}
/>
```

### Feature Highlights with Staggered Animation
```typescript
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, FileText, Sparkles, Target } from "lucide-react"

const features = [
  { icon: Zap, title: "Instant Feedback", description: "Get detailed essay feedback in seconds, not days" },
  { icon: Target, title: "Rubric-Aligned", description: "Scores mapped directly to your rubric criteria" },
  { icon: Sparkles, title: "Highlighted Passages", description: "See exactly which parts of your essay relate to each score" },
  { icon: FileText, title: "PDF Support", description: "Upload rubrics as PDF files for automatic extraction" },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function FeatureHighlights() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      {features.map((f) => (
        <motion.div key={f.title} variants={cardVariants}>
          <Card className="h-full">
            <CardContent className="pt-6 text-center">
              <f.icon className="mx-auto size-8 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### How-It-Works Section
```typescript
const steps = [
  { number: "1", title: "Paste Your Essay", description: "Drop in any essay text or writing sample" },
  { number: "2", title: "Add a Rubric", description: "Upload a PDF rubric or use grade-level defaults" },
  { number: "3", title: "Get Feedback", description: "Receive detailed scores and highlighted passages instantly" },
]

function HowItWorks() {
  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {step.number}
          </div>
          <div>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="hidden h-px w-12 bg-border md:block" />
          )}
        </div>
      ))}
    </div>
  )
}
```

### Animated Walkthrough Demo Approach
The walkthrough demo should simulate the grading flow without actually calling the API. Recommended approach: a sequence of animated "frames" showing:
1. Essay text appearing (typing animation via motion)
2. Rubric card appearing
3. Loading spinner / progress
4. Results with scores and highlighted text appearing

```typescript
// Use motion/react keyframes with delay-based sequencing
// Each "step" fades in after the previous one
const demoSteps = [
  { delay: 0, content: "essay typing" },
  { delay: 2, content: "rubric upload" },
  { delay: 3.5, content: "grading spinner" },
  { delay: 5, content: "results display" },
]

// Wrap in a Card with overflow-hidden to contain the demo
// Use whileInView to only start when visible
// Loop with repeatType: "loop" after a pause
```

This is a CSS/animation-only component -- no real API calls, no real data. Use hardcoded sample text and mock scores.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion/react package | 2024 rebrand | Import from `motion/react` not `framer-motion` |
| react-router-dom | react-router | v7 (2024) | Import from `react-router` not `react-router-dom` |
| Tailwind config file | Tailwind v4 CSS-based config | 2025 | No tailwind.config.js -- theme in index.css `@theme` |

## Open Questions

1. **Walkthrough Demo Complexity**
   - What we know: User wants an animated walkthrough showing the grading flow
   - What's unclear: How elaborate should this be? A looping CSS animation is simple; a multi-step interactive demo is complex
   - Recommendation: Build a self-contained component with a looping sequence of animated mock UI elements (typing effect, score reveal). Keep it purely visual -- no interactivity. This balances impact with implementation effort.

2. **Register Route Placeholder**
   - What we know: Register navigates to `/register`, Phase 17 builds the actual wizard
   - What's unclear: What should happen at `/register` before Phase 17?
   - Recommendation: Create a minimal placeholder page with "Registration coming soon" message, or redirect to landing page. Keep it simple since Phase 17 replaces it entirely.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | Needs investigation (playwright config may exist) |
| Quick run command | `npx playwright test --grep "landing"` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAND-01 | Landing page shows site info and features | smoke | `npx playwright test tests/landing.spec.ts -x` | No - Wave 0 |
| LAND-02 | Sign In and Register buttons visible in page content | smoke | `npx playwright test tests/landing.spec.ts -x` | No - Wave 0 |
| LAND-03 | Landing page separate from grading (auth required) | integration | `npx playwright test tests/auth-routing.spec.ts -x` | No - Wave 0 |
| AUTH2-01 | Sign in via landing page button | integration | `npx playwright test tests/auth-routing.spec.ts -x` | No - Wave 0 |
| AUTH2-02 | Register button navigates to /register | smoke | `npx playwright test tests/landing.spec.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** Visual check in browser -- landing page renders, sign-in works, redirect works
- **Per wave merge:** Full Playwright suite if configured
- **Phase gate:** All 5 requirements manually verified against success criteria

### Wave 0 Gaps
- [ ] Playwright test config -- verify setup exists and works
- [ ] `tests/landing.spec.ts` -- landing page content and button tests
- [ ] `tests/auth-routing.spec.ts` -- auth redirect and protected route tests

## Sources

### Primary (HIGH confidence)
- Project codebase -- `src/App.tsx`, `src/stores/profile-store.ts`, `src/components/auth/SignInDialog.tsx`, `src/components/layout/Layout.tsx`, `src/components/layout/Header.tsx`, `src/pages/GradingPage.tsx`
- `package.json` -- verified all library versions
- `src/index.css` -- verified Tailwind v4 theme tokens and dark mode setup

### Secondary (MEDIUM confidence)
- react-router v7 routing patterns -- based on existing project usage and training data
- motion/react `whileInView` API -- based on existing project usage (AnimatePresence in GradingPage) and training data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - patterns derived directly from existing codebase structure
- Pitfalls: HIGH - based on concrete code analysis (navigation links, auth flash, route changes)
- Animations: MEDIUM - whileInView API well-known but walkthrough demo is design-intensive

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- no external dependencies changing)
