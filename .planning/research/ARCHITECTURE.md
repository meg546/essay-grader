# Architecture Patterns

**Domain:** Essay grading SPA -- v1.1 UX redesign (side-by-side results, text highlighting, collapsible hero, mock auth)
**Researched:** 2026-03-08
**Confidence:** HIGH -- existing codebase analyzed directly, patterns are standard React/Zustand

## Current Architecture Snapshot

Before describing the target architecture, here is what exists today:

```
App.tsx (BrowserRouter)
  Layout (Header + Outlet, max-w-[960px])
    LandingPage        /           -- hero CTA + link to /grade
    GradingPage        /grade      -- input form OR results (conditional on currentResult)
    ProfilePage        /profile    -- sign-in, grade level, history list
```

**Stores:** `app-store` (essayText, rubricFile, currentResult, history) and `profile-store` (email, gradeLevel, isSignedIn). Both use zustand/persist.

**Key observation:** GradingPage already toggles between input mode and results mode via `if (currentResult)`. The redesign replaces this binary toggle with a combined layout where both are visible simultaneously.

## Recommended Architecture

### Route Consolidation

Merge LandingPage and GradingPage into a single `HomePage` at `/`. The current LandingPage is just a hero with a CTA button -- it becomes the collapsible hero section at the top of the combined page. Navigation drops from 3 tabs to 2 (Home, Profile).

```
App.tsx (BrowserRouter)
  Layout (Header + Outlet)
    HomePage           /           -- hero (collapsible) + grading input + results split-pane
    ProfilePage        /profile    -- mock auth (email+password) + settings + history
```

The Layout component currently constrains content to `max-w-[960px]`. A side-by-side view at 960px gives each pane only ~460px, which is too tight. **Move width constraints out of Layout and into each page.** Layout becomes just `Header + Outlet + min-h-screen`. HomePage sets `max-w-[1280px]` for the split-pane view. ProfilePage keeps `max-w-[960px]`. This is a small refactor with high flexibility payoff.

### Component Tree (Target)

```
HomePage
  HeroSection                     -- collapsible via CSS max-height transition
  GradingWorkspace                -- full-width container managing input/results modes
    [INPUT MODE]
      EssayInput                  -- existing, reused as-is
      RubricUpload                -- existing, reused as-is
      SubmitButton
    [RESULTS MODE]
      HighlightProvider           -- React context for active-category hover state
        SplitPaneLayout           -- CSS grid, two columns
          EssayPanel (left)
            HighlightedEssay      -- essay text with color-coded <mark> spans
            EditToggle            -- switches to textarea for resubmit
          FeedbackPanel (right)
            ResultsSummary        -- existing, reused
            ScoreOverview         -- existing, reused
            CategoryFeedback[]    -- existing, enhanced with hover linkage
            ResubmitButton
```

### Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|------------|-----------|
| HomePage | Orchestrates hero collapse + workspace rendering | app-store (currentResult) | -- |
| HeroSection | Marketing copy, animated collapse/expand | app-store (heroCollapsed) | app-store (setHeroCollapsed) |
| GradingWorkspace | Manages input-vs-results mode, handles submission logic | app-store (essayText, rubricFile, currentResult), profile-store (gradeLevel) | app-store (setCurrentResult, addToHistory) |
| HighlightProvider | Scoped React context for active-category index | -- | -- (provides context value) |
| SplitPaneLayout | Pure layout: left/right CSS grid columns | -- | -- |
| HighlightedEssay | Renders essay with inline color-coded highlights per category | essayText + highlights (props), HighlightContext (active category) | -- |
| EssayPanel | Wraps HighlightedEssay, toggles between read-only and editable modes | app-store (essayText) | app-store (setEssayText) |
| FeedbackPanel | Stacks score overview + category feedback cards | currentResult (prop) | -- |
| CategoryFeedback | Per-category feedback display, triggers active highlight on hover | category (prop), HighlightContext | HighlightContext (setActiveCategoryIndex) |

## Data Flow for Text Highlighting

This is the most architecturally significant new feature. The key question: how does feedback map to essay passages?

### Highlight Data Model

The mock API response needs passage references. Extend the existing types:

```typescript
// New type
interface PassageHighlight {
  categoryName: string;       // links to CategoryScore.name
  startOffset: number;        // character offset in essayText
  endOffset: number;          // character offset in essayText
}

// Extended GradingResult (add two fields)
interface GradingResult {
  id: string;
  essayExcerpt: string;
  essayText: string;              // NEW: full essay stored with result
  overallScore: number;
  maxScore: number;
  summary: string;
  categories: CategoryScore[];
  highlights: PassageHighlight[];  // NEW: all highlights across categories
  gradedAt: string;
}
```

**Keep highlights as a flat array on GradingResult**, not nested inside each CategoryScore. Reasons: (1) rendering the highlighted essay requires iterating ALL highlights sorted by offset, which is simpler from a flat list; (2) categories already have `name` as the linkage key; (3) the future backend will likely return highlights as a separate array.

Store `essayText` on the result so history entries can re-render highlights without needing the original input text to still be in the store.

### Highlight Rendering Pipeline

```
GradingResult.highlights (flat array of {categoryName, startOffset, endOffset})
        |
        v
    sortByStartOffset()
        |
        v
    buildSegments(essayText, sortedHighlights)
        |   Splits essay into alternating segments:
        |   [{type:"text", content:"..."}, {type:"highlight", content:"...", categoryName:"..."}, ...]
        v
    HighlightedEssay component
        |   Maps each segment to:
        |   - <span> for plain text
        |   - <mark className={categoryColorMap[categoryName]}> for highlighted text
        v
    Rendered DOM with color-coded passages
```

### Category-to-Color Mapping

Use a deterministic color palette indexed by category position (not name). The existing score-utils uses emerald/amber/rose for score levels, so highlight colors must be distinct:

```typescript
const CATEGORY_HIGHLIGHT_COLORS = [
  { bg: "bg-blue-100",   text: "text-blue-800",   name: "blue"   },
  { bg: "bg-purple-100", text: "text-purple-800", name: "purple" },
  { bg: "bg-orange-100", text: "text-orange-800", name: "orange" },
  { bg: "bg-teal-100",   text: "text-teal-800",   name: "teal"   },
  { bg: "bg-pink-100",   text: "text-pink-800",   name: "pink"   },
  { bg: "bg-yellow-100", text: "text-yellow-800", name: "yellow" },
] as const;
```

Assign colors by the order categories appear in `GradingResult.categories`. The same index drives both the CategoryFeedback card accent color and the `<mark>` highlight color in the essay, creating visual linkage without interaction.

### Interactive Highlight-Feedback Linkage

When a user hovers over a CategoryFeedback card, corresponding highlights in the essay emphasize (full opacity) while other highlights dim (~40% opacity).

**Use a scoped React context, NOT Zustand.** This is ephemeral UI state -- no persistence needed, no cross-page use, no reason to pollute the store:

```typescript
interface HighlightContextValue {
  activeCategoryIndex: number | null;
  setActiveCategoryIndex: (index: number | null) => void;
}
```

- `CategoryFeedback`: `onMouseEnter` sets active index, `onMouseLeave` clears it.
- `HighlightedEssay`: reads active index. Active highlights get full opacity. Others dim via Tailwind `opacity-40` conditional class.

The `HighlightProvider` wraps only the `SplitPaneLayout`, keeping the context tightly scoped.

## State Management Changes

### app-store Modifications

Two additions to the existing store:

```typescript
interface AppState {
  // ... existing fields unchanged ...
  heroCollapsed: boolean;                    // NEW
  setHeroCollapsed: (collapsed: boolean) => void;  // NEW
}
```

Persist `heroCollapsed` via the existing `partialize` config (alongside `history`) so returning users who have already used the app do not see the hero re-expand.

The `GradingResult` type gains `essayText: string` and `highlights: PassageHighlight[]`. The existing `essayExcerpt` remains for history list display. Note: storing full essayText per history entry increases localStorage usage. Cap persisted history at ~20 entries to stay under the ~5MB localStorage limit.

### profile-store Modifications

Add a password parameter to `signIn` for the mock auth form (the value is ignored internally -- it just makes the sign-in form look realistic):

```typescript
signIn: (email: string, password: string) => void;  // password param ignored
```

### No New Stores Needed

Everything fits within the existing two-store pattern. The highlight interaction state uses React context (scoped to the split-pane) precisely because it should NOT be in a store.

## Collapsible Hero Section

### Collapse Triggers

The hero collapses when:
1. User focuses the essay textarea (input begins)
2. User uploads a file
3. Results are showing (`currentResult` is non-null)
4. Previously collapsed (persisted `heroCollapsed` state)

The hero re-expands when:
1. User clicks "Grade Another" (full reset flow)

### Animation Approach

Use CSS `max-height` + `overflow-hidden` + `transition`. Set a generous `max-height` (e.g., 500px) on expanded state, `max-height: 0` on collapsed. Duration: 300ms ease-out.

Do NOT use the existing Radix Collapsible component for this. Radix Collapsible adds ARIA disclosure semantics and keyboard handling meant for interactive widgets. The hero is decorative content, not a disclosure. A simple conditional-class div is correct:

```tsx
<div className={cn(
  "overflow-hidden transition-all duration-300 ease-out",
  heroCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
)}>
  <HeroContent />
</div>
```

## Split-Pane Layout

### CSS Grid, Not a Library

The design is a fixed ~50/50 split with no user-resizable divider. CSS Grid handles this:

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  <EssayPanel />
  <FeedbackPanel />
</div>
```

Below `lg` breakpoint, it stacks vertically (essay on top, feedback below), maintaining tablet responsiveness.

### Independent Scroll

Both panes should scroll independently. Use a fixed height relative to viewport on each:

```tsx
<div className="h-[calc(100vh-12rem)] overflow-y-auto">
  {/* pane content */}
</div>
```

This keeps both panes visible simultaneously. The exact offset (12rem) accounts for header height + hero + padding and should be fine-tuned during implementation.

## Essay Editing in Results View

### Do NOT Use contentEditable

`contentEditable` and React are notoriously incompatible. Highlight `<mark>` elements inside a contentEditable div create cursor/selection nightmares. Text edits would also invalidate all character offsets.

**Instead: toggle between two modes in EssayPanel.**

- **Read mode (default):** `HighlightedEssay` renders the essay with color-coded highlights. An "Edit" button is visible.
- **Edit mode:** A plain `<textarea>` (or the existing `EssayInput` component) replaces the highlighted view. Highlights disappear because the text is being modified. A "Cancel" button restores read mode. A "Resubmit" button sends the modified text through the grading API for fresh results with new highlights.

This is simpler, more reliable, and matches the mental model: editing invalidates previous feedback, so hiding highlights during editing is correct behavior.

## Mock Auth Guard

A simple wrapper component for route protection:

```tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const isSignedIn = useProfileStore((s) => s.isSignedIn);
  if (!isSignedIn) {
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
}
```

**For this project: do NOT gate the grading flow behind auth.** The grading page should work without sign-in for demo purposes. Instead, show a subtle "Sign in to save history" nudge. The auth guard pattern is here for if/when gating is desired, but keeping the demo frictionless is more important.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Ephemeral UI State in Zustand
**What:** Storing hover/active highlight category index in the Zustand store.
**Why bad:** Triggers unnecessary re-renders across unrelated subscribers. Persisting ephemeral hover state is meaningless. Pollutes the store with transient data.
**Instead:** Scoped React context within `SplitPaneLayout`.

### Anti-Pattern 2: contentEditable for Essay Editing
**What:** Making the highlighted essay div `contentEditable` to allow inline editing.
**Why bad:** React and contentEditable fight over DOM ownership. Highlight `<mark>` elements break cursor positioning. Any text change invalidates all character offsets for highlights.
**Instead:** Toggle between read-only highlighted view and plain textarea edit mode.

### Anti-Pattern 3: Dynamic max-height Calculation for Hero Collapse
**What:** Using `ref.scrollHeight` to compute exact max-height for smooth animation.
**Why bad:** Requires ResizeObserver for responsive changes, adds complexity, and is fragile across layout shifts.
**Instead:** Use a generous fixed `max-height` that exceeds the hero's natural height. The CSS transition still looks smooth because it animates from the current rendered height toward 0.

### Anti-Pattern 4: Overlapping Highlight Spans
**What:** Allowing highlights from different categories to overlap the same text range, creating nested `<mark>` elements.
**Why bad:** Nested marks create ambiguous visual styling and complex DOM. Which color wins?
**Instead:** In `buildSegments`, if two highlights overlap, split into sub-segments where each has a single category. For the mock data, simply avoid overlapping ranges entirely.

### Anti-Pattern 5: Resizable Split Pane Library
**What:** Installing `react-split-pane` or similar for the side-by-side layout.
**Why bad:** Over-engineered for a fixed split. Adds a dependency, drag handle UX, and state management for pane sizes that are not part of the design.
**Instead:** CSS Grid with fixed column ratios. Two lines of Tailwind.

## Suggested Build Order (Dependencies)

Each step builds on the previous. Items at the same level can be parallelized.

| Order | Component(s) | Depends On | Rationale |
|-------|-------------|------------|-----------|
| 1 | Type extensions (`PassageHighlight`, extend `GradingResult` with `essayText` + `highlights`) | Nothing | Everything downstream depends on the data shape |
| 2 | Mock data with highlights + updated `gradeEssay` mock returning essayText | Step 1 | Need realistic data to develop and test against |
| 3 | `highlight-utils.ts` (`buildSegments`, `sortByOffset`) + `category-colors.ts` | Step 1 | Pure logic, testable in isolation, critical correctness |
| 4 | Layout refactor: move `max-w-*` from Layout to individual pages | Nothing | Unblocks the wider split-pane; can be done in parallel with steps 1-3 |
| 5 | Route consolidation: create HomePage, merge LandingPage content, update Header nav to 2 tabs | Step 4 | Structural change that everything else sits within |
| 6 | `HeroSection` + `heroCollapsed` state in app-store | Step 5 | Hero lives inside HomePage; needs the route to exist |
| 7 | `HighlightedEssay` component + `HighlightContext` / `HighlightProvider` | Steps 2, 3 | Core rendering for the left pane of results view |
| 8 | `SplitPaneLayout` + `EssayPanel` + `FeedbackPanel` | Step 7, existing results components | Composes the two-column results view |
| 9 | `GradingWorkspace` (input mode -> submission -> results mode transition) | Steps 6, 8 | Orchestration layer tying hero collapse to grading flow |
| 10 | `CategoryFeedback` hover linkage via HighlightContext | Steps 7, 8 | Interactive polish: hover a card, highlights emphasize |
| 11 | Edit mode toggle + resubmit in EssayPanel | Step 9 | Requires full flow working before adding edit capability |
| 12 | Mock auth enhancement (add password field to ProfilePage sign-in form) | Nothing | Independent, lowest priority, purely cosmetic |

**Phase groupings for the roadmap:**
- **Data layer** (steps 1-3): Type changes, mock data, highlight utilities
- **Structural** (steps 4-6): Layout refactor, route merge, hero section
- **Core feature** (steps 7-10): Highlighting, split-pane, workspace orchestration
- **Polish** (steps 11-12): Edit/resubmit, auth form enhancement

## Scalability Considerations

| Concern | Now (Mock Data) | At Backend Integration | Mitigation |
|---------|----------------|----------------------|------------|
| Essay length | ~500 words mock | Up to 5000+ words | `buildSegments` is O(n+h) where n=text length, h=highlight count. Fine for any essay length. |
| Highlight count | 4-8 mock highlights | Could be 20-50 from real AI | Sort + segment build stays fast. May need a "show fewer categories" toggle if visual density gets high. |
| Re-render on hover | Context triggers re-render of both panes | Same | `useMemo` on segments prevents recomputation. Only opacity CSS class toggles on hover. |
| History + localStorage | Full essayText + highlights per entry | Will move to backend DB | Cap history at ~20 entries. Strip highlights from old entries if storage grows. |
| Layout at narrow widths | CSS Grid stacks to single column below `lg` | Same | When stacked, highlights and feedback are above/below -- still usable, just not side-by-side. |

## Sources

- Existing codebase analysis (all files in `src/`) -- primary source for integration decisions
- React documentation: Context API for scoped state, avoiding contentEditable with controlled components
- CSS specification: `max-height` transitions for collapsible sections
- Zustand persist middleware `partialize` configuration (existing usage in codebase)
