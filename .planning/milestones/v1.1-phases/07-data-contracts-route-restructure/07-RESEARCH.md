# Phase 7: Data Contracts & Route Restructure - Research

**Researched:** 2026-03-08
**Domain:** TypeScript data contracts, React Router restructuring, Tailwind layout changes
**Confidence:** HIGH

## Summary

Phase 7 is a foundational infrastructure phase with three discrete workstreams: (1) extending the mock API data contract with highlight range types, (2) consolidating navigation from three tabs to two while removing the mobile hamburger menu, and (3) removing the 960px max-width constraint from Layout and Header. All changes are straightforward modifications to existing files with no new library dependencies.

The codebase is well-structured for these changes. Types live in `src/api/types.ts`, mock data in `src/api/mock-data.ts`, routing in `src/App.tsx`, navigation in `src/components/layout/Header.tsx`, and layout in `src/components/layout/Layout.tsx`. The existing patterns (typed interfaces, mock data conforming to those interfaces, React Router v7 declarative routes) make these changes low-risk.

**Primary recommendation:** Execute as three independent tasks -- data contract first (downstream phases depend on the shape), then routes and layout in parallel.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- One highlight range per feedback point (each strength/improvement gets its own highlight)
- Character offsets (start, end) into the raw essay text string
- Overlapping highlights allowed -- same passage can relate to multiple categories
- Each highlight includes a type field: 'strength' or 'improvement'
- Each highlight carries categoryId linking it to the parent rubric category
- Replace root route (/) with GradingPage -- the combined home/grading page becomes the app root
- Delete LandingPage component entirely -- Phase 8 builds the hero fresh within grading page
- Remove /grade route entirely (no redirect) -- dev project, no real users with bookmarks
- Final routes: / (GradingPage) and /profile (ProfilePage)
- Remove max-w-[960px] entirely from both Layout main area and Header
- Content goes full-width with padding -- side-by-side layout in Phase 9 manages its own constraints
- Header also goes full-width (consistent with content area)
- Two tabs only: Home and Profile
- Always-visible tabs on mobile -- remove hamburger/Sheet menu (2 tabs don't need it)
- Keep left-aligned branding (EssayGrader + icon) with tabs on the right
- Home tab stays active for entire grading workflow (input, loading, results all at /)

### Claude's Discretion
- Horizontal padding amount for full-width layout (currently px-4)
- Exact structure of the highlight TypeScript interfaces
- How mock highlight data maps to the existing mock essay text

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HLGT-01 | Mock API responses include highlight ranges (start, end, categoryId) mapping feedback to essay passages | Data contract design with HighlightRange interface; mock data generation with character offsets tied to existing mock essay text |
| NAV-01 | Navigation has two tabs: Home and Profile | navItems array reduction in Header.tsx; removal of Sheet/hamburger mobile menu |
| NAV-02 | Home tab navigates to the combined grading page, Profile tab to profile/auth page | Route consolidation in App.tsx: GradingPage at /, ProfilePage at /profile; LandingPage deletion |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | ^7.13.1 | Declarative routing | Already in use; route changes are config-only |
| zustand | ^5.0.11 | State management | Store already holds GradingResult; type changes flow through |
| tailwindcss | ^4.2.1 | Utility-first CSS | Layout width changes are class edits |
| typescript | ~5.9.3 | Type safety | Interface definitions for data contracts |

### No New Libraries Needed
This phase is purely structural. No additional npm packages are required.

## Architecture Patterns

### Recommended Change Structure
```
src/
├── api/
│   ├── types.ts          # Add HighlightRange, update CategoryScore
│   ├── mock-data.ts      # Add highlight ranges to mock categories
│   └── grading.ts        # No changes needed (returns mockGradingResult)
├── components/layout/
│   ├── Header.tsx         # 2 tabs, remove Sheet, remove max-w
│   └── Layout.tsx         # Remove max-w-[960px]
├── pages/
│   ├── GradingPage.tsx    # No changes (already exists)
│   ├── ProfilePage.tsx    # No changes
│   └── LandingPage.tsx    # DELETE this file
└── App.tsx                # Update routes: / -> GradingPage, remove /grade
```

### Pattern 1: Highlight Data Contract

**What:** Add a `HighlightRange` interface and attach highlights to each `CategoryScore`.

**Design:**
```typescript
// src/api/types.ts

export interface HighlightRange {
  start: number;        // character offset into raw essay text
  end: number;          // character offset (exclusive)
  categoryId: string;   // links to parent rubric category
  type: 'strength' | 'improvement';
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  justification: string;
  highlights: HighlightRange[];  // NEW: one per strength/improvement
}
```

**Key decisions reflected:**
- `categoryId` is a string identifier derived from the category name (e.g., slugified or kebab-cased)
- Each highlight has a `type` field distinguishing strengths from improvements
- `highlights` array lives on `CategoryScore`, not on `GradingResult`, keeping the data co-located with the category it belongs to
- Character offsets are into the raw essay text string (the `essayText` submitted by the user)

**Alternative considered:** A flat `highlights[]` on `GradingResult` level. Rejected because it separates highlights from their parent category, requiring extra lookups.

### Pattern 2: Mock Highlight Data

**What:** The mock data needs realistic character offsets that correspond to actual text in the mock essay excerpt.

**Challenge:** The current `mockGradingResult.essayExcerpt` is only ~170 characters. For meaningful highlights, the mock data needs a longer essay text, or highlights need to reference short ranges within the excerpt.

**Recommendation:** Add a `mockEssayText` constant with a full multi-paragraph mock essay (the one the excerpts reference). Map highlight `start`/`end` values to actual substrings of this text. The `gradeEssay` function can store/return the full essay text as part of the result so downstream phases (Phase 9) can render it with highlights.

**Implication for types:** `GradingResult` may need an `essayText: string` field (full text, not just excerpt) so the results view has the complete text for highlighting. This should be added now to avoid a breaking change later.

### Pattern 3: Route Consolidation

**What:** Simplify from 3 routes to 2, move GradingPage to root.

**Current state:**
```typescript
// App.tsx - CURRENT
<Route path="/" element={<LandingPage />} />
<Route path="/grade" element={<GradingPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

**Target state:**
```typescript
// App.tsx - TARGET
<Route path="/" element={<GradingPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

**Cleanup required:**
- Delete `src/pages/LandingPage.tsx` entirely
- Remove `LandingPage` import from `App.tsx`
- No redirects needed (dev project, per user decision)

### Pattern 4: Navigation Simplification

**What:** Reduce navItems to 2, remove Sheet/hamburger menu, show tabs always.

**Current state:** 3 nav items + Sheet mobile menu (hidden `md:flex`, hamburger `md:hidden`)

**Target state:**
```typescript
const navItems = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
] as const;
```

**Mobile menu removal:**
- Remove `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` imports
- Remove `MenuIcon` import
- Remove `useState` for `sheetOpen`
- Remove the `md:hidden` hamburger div entirely
- Change desktop nav from `hidden md:flex` to just `flex` (always visible)

**NavLinkItem active state:** The current logic `to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)` works correctly -- Home stays active for all grading workflow states at `/`.

### Anti-Patterns to Avoid
- **Don't add highlights to `GradingResult` top-level:** Keep them on `CategoryScore` where they belong. Phase 9 iterates categories anyway.
- **Don't create redirect from /grade:** User explicitly decided no redirects.
- **Don't use responsive hiding for tabs:** With only 2 tabs, always show them. No breakpoint logic needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route management | Custom navigation state | React Router declarative `<Route>` | Already in place, just remove/change paths |
| Mobile menu | Custom dropdown | Nothing -- 2 tabs fit on any screen | Sheet/hamburger is unnecessary overhead |

## Common Pitfalls

### Pitfall 1: Forgetting to Update Store Types
**What goes wrong:** `GradingResult` stored in Zustand includes `CategoryScore[]`. If `CategoryScore` gains `highlights`, existing persisted data in localStorage won't have it.
**Why it happens:** Zustand persist middleware saves to localStorage. Old data lacks new fields.
**How to avoid:** `highlights` should default to `[]` (empty array). The app should handle `highlights` being `undefined` gracefully (optional chaining or default). Alternatively, bump the persist version or clear storage.
**Warning signs:** Console errors about reading properties of undefined on `highlights`.

### Pitfall 2: NavLinkItem Active State for Root
**What goes wrong:** After moving GradingPage to `/`, the Home tab's active detection could break if logic changes.
**Why it happens:** The existing `isActive` check for `/` uses exact match (`location.pathname === "/"`). This is correct and should be kept as-is.
**How to avoid:** Don't change the NavLinkItem active state logic. It already handles `/` correctly.

### Pitfall 3: Mock Highlight Offsets Out of Bounds
**What goes wrong:** Highlight `start`/`end` values exceed the mock essay text length, or point to wrong substrings.
**Why it happens:** Manual character counting is error-prone.
**How to avoid:** Use `mockEssayText.indexOf("target phrase")` to calculate offsets programmatically when building mock data, or at minimum verify offsets with `mockEssayText.slice(start, end)` comments.

### Pitfall 4: Unused Imports After Cleanup
**What goes wrong:** Build warnings or lint errors from leftover imports (Sheet, MenuIcon, useState for sheetOpen, LandingPage).
**Why it happens:** Removing components but forgetting their imports.
**How to avoid:** Run `npm run lint` and `npm run build` after changes to catch dead imports.

## Code Examples

### Adding HighlightRange to Types
```typescript
// src/api/types.ts
export interface HighlightRange {
  start: number;
  end: number;
  categoryId: string;
  type: 'strength' | 'improvement';
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  justification: string;
  highlights: HighlightRange[];
}
```

### Mock Data with Highlights
```typescript
// src/api/mock-data.ts
const contentAndIdeas: CategoryScore = {
  name: "Content & Ideas",
  score: 5,
  maxScore: 6,
  strengths: [
    "Strong central argument about the role of technology in modern education",
    // ...
  ],
  improvements: [
    "Could explore long-term societal implications in greater depth",
    // ...
  ],
  justification: "...",
  highlights: [
    { start: 0, end: 95, categoryId: "content-ideas", type: "strength" },
    { start: 280, end: 355, categoryId: "content-ideas", type: "improvement" },
  ],
};
```

### Simplified Header (no Sheet)
```typescript
// src/components/layout/Header.tsx - simplified
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <GraduationCapIcon className="size-5" />
          <span>EssayGrader</span>
        </NavLink>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLinkItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
      </div>
    </header>
  );
}
```

### Full-Width Layout
```typescript
// src/components/layout/Layout.tsx
export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3-page navigation | 2-tab navigation | This phase | Simpler UX, matches v1.1 design |
| Constrained 960px layout | Full-width with padding | This phase | Unblocks Phase 9 side-by-side |
| No highlight data | HighlightRange in CategoryScore | This phase | Enables Phase 9 text highlighting |

## Open Questions

1. **Full essay text in GradingResult**
   - What we know: Current `GradingResult` only stores `essayExcerpt` (first 120 chars). Phase 9 needs the full essay text to render highlights.
   - What's unclear: Should `essayText` be added to `GradingResult` now, or handled in Phase 9?
   - Recommendation: Add `essayText: string` to `GradingResult` now alongside highlights. The grading function already receives `essayText` -- just pass it through to the result. This avoids a type-breaking change later and keeps the data contract complete.

2. **CategoryId generation strategy**
   - What we know: Each highlight needs a `categoryId` linking to its parent category. Categories currently only have a `name` string.
   - What's unclear: Should categories get a new `id` field, or should `categoryId` in highlights be derived from the name?
   - Recommendation: Add an `id: string` field to `CategoryScore` (e.g., `"content-ideas"`, `"organization"`). This is cleaner than using name strings as identifiers and enables reliable lookups in Phase 9. Keep `name` for display.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/api/types.ts`, `src/api/mock-data.ts`, `src/api/grading.ts`, `src/App.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Layout.tsx`, `src/pages/LandingPage.tsx`, `src/pages/GradingPage.tsx`, `src/stores/app-store.ts`
- `package.json` for exact dependency versions

### Secondary (MEDIUM confidence)
- React Router v7 routing patterns (well-known, stable API)
- Zustand persist middleware behavior with schema changes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all changes to existing well-understood files
- Architecture: HIGH - data contract design is straightforward; route changes are minimal
- Pitfalls: HIGH - identified from direct code inspection of persistence, active states, and cleanup needs

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no external dependency changes)
