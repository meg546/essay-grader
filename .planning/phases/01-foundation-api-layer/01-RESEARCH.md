# Phase 1: Foundation & API Layer - Research

**Researched:** 2026-03-08
**Domain:** React/TypeScript project scaffolding, shadcn/ui theming, routing, mock API layer
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Warm earthy tones: soft sage greens, warm grays, cream backgrounds
- Sage green as the primary accent color (blending Grammarly's clean feel with earthy warmth)
- Grammarly-inspired overall aesthetic -- clean white interface with green accents and focused tool feel
- Clean functional polish -- professional and consistent, but no over-investment in animations or micro-interactions
- System fonts (Inter/system stack) -- no external font dependencies
- Rounded-lg/xl corners on cards and buttons -- friendly, approachable feel
- CSS custom properties from day one to support dark mode in Phase 5 without refactoring
- shadcn/ui + Tailwind CSS
- Copy-paste components with full control and customization
- Customize shadcn default theme to match warm earthy palette
- Top bar with tab-style navigation (Landing, Grade, Results, History)
- Centered max-width content area (~900-1000px) -- focused reading/writing feel like Grammarly
- At 768px tablet breakpoint: tabs collapse into hamburger/drawer menu
- Each placeholder page shows skeleton mockups (gray boxes suggesting future layout, not just titles)

### Claude's Discretion
- Header branding (app name with or without icon -- whatever fits the design)
- Mock API data realism level and specific data shapes
- Exact spacing, shadows, and micro-interactions
- Router library choice (React Router or TanStack Router)
- State management setup (Zustand store structure)
- Error state handling approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | All backend interactions use typed async functions returning mock data | Mock API layer pattern with TypeScript generics, simulated delay utility |
| API-02 | Mock data includes simulated delays for realistic feel | `sleep()` utility + configurable delay per endpoint |
| API-03 | API layer is structured so swapping to real Axios calls requires only changing function bodies | Service module pattern with typed interfaces separate from implementation |
| NAVL-02 | User can navigate between landing, grading, results, and history pages | React Router v7 with four route definitions |
| NAVL-04 | UI is responsive down to tablet (768px) | Tailwind responsive breakpoints + Sheet component for mobile nav |
| NAVL-05 | UI has clean, professional, education-focused design with calm color palette | shadcn/ui with custom warm earthy OKLCH CSS variables |

</phase_requirements>

## Summary

This phase scaffolds a greenfield React/TypeScript project using Vite, establishes the visual design system with shadcn/ui and Tailwind CSS v4, creates typed mock API functions, sets up routing between four pages, and builds a responsive layout shell. Every subsequent phase builds on this foundation.

The stack is well-established and mature: Vite for build tooling, shadcn/ui for component primitives, Tailwind v4 for styling, and React Router for navigation. The primary complexity lies in correctly configuring the shadcn/ui theme with custom warm earthy OKLCH color variables and ensuring the responsive navigation breakpoint works cleanly with the Sheet component for mobile.

**Primary recommendation:** Scaffold with `npx shadcn@latest init -t vite`, customize the CSS variables for the sage/cream palette, add React Router v7 for SPA routing, and build a simple mock API service layer with typed interfaces and configurable delays.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Current stable, shadcn/ui v4 uses it by default |
| TypeScript | 5.x | Type safety | Standard for all modern React projects |
| Vite | 6.x | Build tool / dev server | 40x faster than CRA, native ESM, HMR |
| Tailwind CSS | 4.x | Utility-first CSS | shadcn/ui defaults to v4 for new projects |
| shadcn/ui | latest | Component primitives | User's locked decision; copy-paste, full control |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Router | 7.x | Client-side routing | SPA navigation between 4 pages (see recommendation below) |
| Zustand | 5.x | State management | Lightweight global state for grading data, history |
| clsx + tailwind-merge | latest | Class merging | Already included via shadcn/ui's `cn()` utility |

### Router Recommendation (Claude's Discretion)

**Use React Router v7** (not TanStack Router). Rationale:
- This is a simple 4-page SPA with no complex nested layouts or search param requirements
- React Router v7 is ~20KB vs TanStack Router's ~45KB
- React Router has vastly larger ecosystem of examples and community patterns
- TanStack Router's type-safe search params and advanced data loading are overkill here
- The project has no SSR/framework mode needs -- pure SPA

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router v7 | TanStack Router | Better type safety for search params, but overkill for 4 simple routes |
| Zustand | React Context | Fine for small state, but Zustand is simpler for cross-component state + persistence later |

**Installation:**
```bash
npm create vite@latest essay-grader -- --template react-ts
cd essay-grader
npx shadcn@latest init
npm install react-router zustand
```

Note: `npx shadcn@latest init` with a fresh Vite project will configure Tailwind v4, path aliases, and the `cn()` utility automatically.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── api/                 # Mock API service layer
│   ├── types.ts         # Shared API types/interfaces
│   ├── mock-data.ts     # Mock response data
│   ├── delay.ts         # Simulated delay utility
│   ├── grading.ts       # gradeEssay(), getGradingResult()
│   └── history.ts       # getHistory(), getHistoryItem()
├── components/
│   ├── ui/              # shadcn/ui primitives (auto-generated)
│   ├── layout/          # Header, Layout, MobileNav
│   └── skeletons/       # Placeholder skeleton components per page
├── pages/               # Route-level page components
│   ├── LandingPage.tsx
│   ├── GradingPage.tsx
│   ├── ResultsPage.tsx
│   └── HistoryPage.tsx
├── stores/              # Zustand stores
│   └── app-store.ts     # App-level state (current essay, results, history)
├── lib/
│   └── utils.ts         # cn() utility (auto-generated by shadcn)
├── App.tsx              # Router + Layout wrapper
├── main.tsx             # Entry point
└── index.css            # Tailwind + CSS custom properties
```

### Pattern 1: Mock API Service Layer
**What:** Typed async functions that return mock data after a simulated delay, with interfaces that match what a real API would return.
**When to use:** All data fetching in the app goes through these functions.
**Example:**
```typescript
// src/api/delay.ts
export function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/api/types.ts
export interface GradingResult {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  summary: string;
  categories: CategoryScore[];
  gradedAt: string;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  justification: string;
}

export interface GradeEssayRequest {
  essayText: string;
  rubric: RubricCategory[];
}

export interface RubricCategory {
  name: string;
  maxScore: number;
}

// src/api/grading.ts
import { delay } from "./delay";
import { mockGradingResult } from "./mock-data";
import type { GradeEssayRequest, GradingResult } from "./types";

export async function gradeEssay(request: GradeEssayRequest): Promise<GradingResult> {
  await delay(1500); // Visible simulated delay
  return mockGradingResult;
}

export async function getGradingResult(id: string): Promise<GradingResult> {
  await delay(600);
  return mockGradingResult;
}
```

**Key design principle for API-03:** The function signatures and return types stay the same when swapping to real API calls. Only the function bodies change (replace `delay()` + mock return with `axios.get()` / `axios.post()`).

### Pattern 2: Responsive Navigation with shadcn/ui Sheet
**What:** Desktop shows tab-style navigation in the header. At 768px breakpoint, tabs are hidden and a hamburger button reveals a Sheet (slide-out drawer) with navigation links.
**When to use:** The app's main layout header.
**Example:**
```typescript
// Desktop: visible at md breakpoint and up
<nav className="hidden md:flex gap-1">
  <NavLink to="/" className={navLinkClass}>Landing</NavLink>
  <NavLink to="/grade" className={navLinkClass}>Grade</NavLink>
  <NavLink to="/results" className={navLinkClass}>Results</NavLink>
  <NavLink to="/history" className={navLinkClass}>History</NavLink>
</nav>

// Mobile: visible below md breakpoint
<Sheet>
  <SheetTrigger asChild className="md:hidden">
    <Button variant="ghost" size="icon">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <nav className="flex flex-col gap-2 mt-8">
      <NavLink to="/" ...>Landing</NavLink>
      <NavLink to="/grade" ...>Grade</NavLink>
      <NavLink to="/results" ...>Results</NavLink>
      <NavLink to="/history" ...>History</NavLink>
    </nav>
  </SheetContent>
</Sheet>
```

### Pattern 3: CSS Custom Properties for Theming
**What:** Define all colors as OKLCH CSS variables in `:root` and `.dark` pseudo-classes. shadcn/ui + Tailwind v4 uses these natively via `@theme inline`.
**When to use:** All color definitions -- supports dark mode in Phase 5 without refactoring.
**Example:**
```css
/* index.css */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.75rem;
  /* Warm cream background */
  --background: oklch(0.97 0.005 90);
  --foreground: oklch(0.20 0.02 60);
  /* Sage green primary */
  --primary: oklch(0.55 0.10 145);
  --primary-foreground: oklch(0.98 0.005 90);
  /* Warm gray secondary */
  --secondary: oklch(0.94 0.008 80);
  --secondary-foreground: oklch(0.25 0.02 60);
  /* Card surfaces */
  --card: oklch(0.99 0.003 90);
  --card-foreground: oklch(0.20 0.02 60);
  /* Muted elements */
  --muted: oklch(0.93 0.008 80);
  --muted-foreground: oklch(0.50 0.02 60);
  /* Accent (lighter sage) */
  --accent: oklch(0.92 0.03 145);
  --accent-foreground: oklch(0.25 0.05 145);
  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);
  /* Borders and inputs */
  --border: oklch(0.88 0.01 80);
  --input: oklch(0.88 0.01 80);
  --ring: oklch(0.55 0.10 145);
}

.dark {
  --background: oklch(0.15 0.01 60);
  --foreground: oklch(0.93 0.005 90);
  --primary: oklch(0.60 0.10 145);
  --primary-foreground: oklch(0.15 0.01 60);
  --secondary: oklch(0.22 0.01 60);
  --secondary-foreground: oklch(0.90 0.005 90);
  --card: oklch(0.18 0.01 60);
  --card-foreground: oklch(0.93 0.005 90);
  --muted: oklch(0.25 0.01 60);
  --muted-foreground: oklch(0.60 0.01 80);
  --accent: oklch(0.25 0.03 145);
  --accent-foreground: oklch(0.85 0.05 145);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.30 0.01 60);
  --input: oklch(0.30 0.01 60);
  --ring: oklch(0.60 0.10 145);
}
```

Note: These OKLCH values produce the warm sage/cream palette. The exact values should be fine-tuned visually during implementation, but this gives the correct hue/chroma directions (hue ~145 for sage green, ~60-90 for warm grays/creams).

### Pattern 4: Skeleton Placeholders
**What:** Each page shows gray boxes that hint at future layout, not just text titles.
**When to use:** All four placeholder pages in Phase 1.
**Example:**
```typescript
// Grading page skeleton: suggests textarea + rubric layout
export function GradingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded-lg" /> {/* Page title */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-muted rounded-xl" /> {/* Textarea area */}
        <div className="space-y-3">
          <div className="h-12 bg-muted rounded-lg" /> {/* Rubric row */}
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="h-12 w-40 bg-primary/20 rounded-xl" /> {/* Submit button */}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Importing colors as hardcoded hex/rgb values:** Always use CSS variables via Tailwind classes (`bg-primary`, `text-foreground`). Hardcoded values break dark mode.
- **Coupling mock data shape to component rendering:** Keep API types in `api/types.ts`, separate from component props. Components should receive typed data, not reach into the mock layer directly.
- **Using React context for state that needs to persist or be accessed from multiple unrelated components:** Use Zustand instead -- it is simpler and does not require provider nesting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component primitives (buttons, sheets, dialogs) | Custom styled components | shadcn/ui components | Accessibility, keyboard nav, focus management built-in |
| Responsive drawer/sheet | Custom CSS/JS drawer | shadcn/ui Sheet component | Animation, scroll lock, overlay, focus trap handled |
| Class name merging | String concatenation | `cn()` from shadcn (clsx + tailwind-merge) | Handles Tailwind class conflicts correctly |
| Route management | Manual `window.location` or hash routing | React Router v7 | Handles history, params, lazy loading, transitions |
| CSS reset / base styles | Custom reset stylesheet | Tailwind preflight (built-in) | Standard, well-tested, maintained |

**Key insight:** shadcn/ui gives you the actual source code of each component. You own every file and can modify anything -- there is no runtime dependency. This means "don't hand-roll" here means "use the CLI to add a component, then customize it" rather than building from scratch.

## Common Pitfalls

### Pitfall 1: Forgetting Path Alias Configuration
**What goes wrong:** `@/components/...` imports fail with module not found errors.
**Why it happens:** shadcn/ui uses `@/` path aliases, but Vite and TypeScript each need separate configuration.
**How to avoid:** The `npx shadcn@latest init` command should handle this automatically for Vite projects. Verify that both `tsconfig.json` (paths) and `vite.config.ts` (resolve.alias) are configured.
**Warning signs:** Red squiggles on `@/` imports in the editor, or build errors referencing missing modules.

### Pitfall 2: OKLCH Color Values Look Wrong
**What goes wrong:** Colors appear washed out, too saturated, or not matching the intended palette.
**Why it happens:** OKLCH is perceptually uniform but unfamiliar to most developers. Small chroma changes have big visual impact.
**How to avoid:** Use a visual tool like [tweakcn.com](https://tweakcn.com/) or the [oklch.com](https://oklch.com/) color picker to preview values. Test in both light and dark contexts. Start with the base shadcn "Stone" or "Neutral" base color and adjust the hue toward sage green.
**Warning signs:** Colors that look fine on one monitor but wrong on another -- OKLCH is more consistent than HSL, but still verify visually.

### Pitfall 3: Mobile Navigation Not Closing After Route Change
**What goes wrong:** User taps a nav link in the mobile Sheet, navigates to the page, but the Sheet stays open.
**Why it happens:** Sheet open state is not connected to route changes.
**How to avoid:** Use React Router's `useLocation` or `useNavigate` to close the Sheet on navigation. Or control Sheet's `open` state and set it to `false` in the `onClick` handler of each nav link.
**Warning signs:** Manual QA -- tap a link in the mobile nav and check if the sheet closes.

### Pitfall 4: Not Setting Up Dark Mode CSS Variable Structure from Day One
**What goes wrong:** Phase 5 requires dark mode, but all colors were defined inline or with Tailwind's default palette, requiring massive refactoring.
**Why it happens:** Skipping the CSS variable setup seems faster initially.
**How to avoid:** Define ALL colors as CSS variables in `:root` and `.dark` from the start (even if dark mode toggle comes in Phase 5). Use only CSS variable-backed Tailwind classes.
**Warning signs:** Any color value appearing directly in component code (`text-green-600` instead of `text-primary`).

### Pitfall 5: Mock API Functions That Are Synchronous or Return Instantly
**What goes wrong:** UI loading states are never visible, making them impossible to test or demo.
**Why it happens:** Developers skip the delay for convenience during development.
**How to avoid:** Make the delay mandatory (not optional) in mock functions. Use 600-1500ms delays to make loading states clearly visible.
**Warning signs:** Submitting a form and seeing results appear instantly with no loading indicator.

## Code Examples

### React Router v7 SPA Setup
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { LandingPage } from "@/pages/LandingPage";
import { GradingPage } from "@/pages/GradingPage";
import { ResultsPage } from "@/pages/ResultsPage";
import { HistoryPage } from "@/pages/HistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/grade" element={<GradingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Layout Component with Outlet
```typescript
// src/components/layout/Layout.tsx
import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[960px] px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### Zustand Store (Minimal Initial Setup)
```typescript
// src/stores/app-store.ts
import { create } from "zustand";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentResult: null,
  history: [],
  setCurrentResult: (result) => set({ currentResult: result }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
}));
```

### shadcn/ui Components to Add
```bash
# Required for Phase 1
npx shadcn@latest add button
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
```

- **Button** -- navigation links, CTAs
- **Sheet** -- mobile hamburger menu drawer
- **Skeleton** -- placeholder loading states (though custom div boxes also work for page skeletons)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite | 2023+ | CRA is officially deprecated; Vite is the standard |
| Tailwind v3 (config file) | Tailwind v4 (@theme directive) | 2025 | CSS-first config, OKLCH colors, no tailwind.config.js |
| HSL color format | OKLCH color format | Tailwind v4 | Perceptually uniform, wider gamut |
| React Router v6 | React Router v7 | 2024 | Simplified API, better TypeScript support |
| forwardRef components | Direct ref prop (React 19) | 2024 | shadcn/ui components no longer use forwardRef |

**Deprecated/outdated:**
- Create React App: officially deprecated, do not use
- tailwind.config.js: Tailwind v4 uses CSS-based configuration via `@theme` directive
- HSL CSS variables in shadcn: v4 uses OKLCH format

## Open Questions

1. **Exact OKLCH values for the sage/cream palette**
   - What we know: Hue ~145 for sage green, ~60-90 for warm tones, cream backgrounds at high lightness
   - What's unclear: Exact chroma and lightness values that "feel right" for the Grammarly-inspired warmth
   - Recommendation: Start with values in the Code Examples section above, fine-tune visually during implementation using oklch.com or tweakcn.com

2. **React Router v7 import path**
   - What we know: v7 may use `react-router` instead of `react-router-dom` for imports
   - What's unclear: Whether the SPA (declarative) mode still uses `react-router-dom` or unified `react-router`
   - Recommendation: Check the actual installed package's exports during implementation; both work, just be consistent

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Vite installation docs](https://ui.shadcn.com/docs/installation/vite) - Installation steps, CLI commands
- [shadcn/ui Theming docs](https://ui.shadcn.com/docs/theming) - CSS variable structure, OKLCH format, background/foreground convention
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) - Tailwind v4 support, @theme directive, OKLCH migration
- [Vite official guide](https://vite.dev/guide/) - Project scaffolding, template options

### Secondary (MEDIUM confidence)
- [TanStack Router vs React Router v7 comparison (Jan 2026)](https://medium.com/ekino-france/tanstack-router-vs-react-router-v7-32dddc4fcd58) - Bundle size, feature comparison
- [shadcn/ui Sheet navigation pattern](https://www.shadcn.io/patterns/sheet-navigation-1) - Mobile hamburger menu implementation
- [Zustand TypeScript guide](https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript) - Store typing patterns
- [tweakcn.com](https://tweakcn.com/) - shadcn/ui theme editor for visual color customization

### Tertiary (LOW confidence)
- OKLCH color values in the example CSS -- these are educated approximations based on the desired palette description. Must be validated visually.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, well-established ecosystem
- Architecture: HIGH - Standard patterns for Vite + React Router + shadcn/ui projects
- Pitfalls: HIGH - Common issues documented across multiple sources
- Color palette values: MEDIUM - OKLCH values are approximations that need visual validation

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable stack, 30-day validity)
