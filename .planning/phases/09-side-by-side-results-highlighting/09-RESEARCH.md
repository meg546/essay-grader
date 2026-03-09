# Phase 9: Side-by-Side Results & Highlighting - Research

**Researched:** 2026-03-08
**Domain:** CSS Grid split-pane layout, text highlight rendering, React context for cross-panel interaction
**Confidence:** HIGH

## Summary

Phase 9 transforms the existing single-column results view into a two-column layout with the essay (highlighted by category) on the left and feedback/scores on the right. The technical foundation is already solid: `GradingResult` stores `essayText`, each `CategoryScore` contains a `highlights: HighlightRange[]` array with character offsets (`start`, `end`, `categoryId`, `type`), and the mock data in `mock-data.ts` already populates realistic highlight ranges via the `hl()` helper.

The primary implementation work is: (1) a segment-builder utility that splits essay text into plain and highlighted spans, (2) a `HighlightedEssay` component rendering color-coded `<mark>` elements, (3) CSS Grid two-column layout with independent scroll, (4) a scoped React context for hover/click interaction between feedback cards and essay highlights, and (5) a color legend with per-category toggles.

No new npm dependencies are required. The existing stack (React 19, Tailwind CSS 4, Motion, Zustand 5, Lucide icons) covers all needs. The `motion` library (already installed) can handle the pulse animation on hover.

**Primary recommendation:** Build a `buildSegments()` pure function to convert essay text + highlight ranges into renderable segments, use CSS Grid for the split layout, and use a scoped React context (not Zustand) for ephemeral hover-linking state between panels.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-03 | After grading, results display in side-by-side layout with essay on left and feedback/scores on right | CSS Grid two-column layout pattern; existing results components reused in right panel |
| LAYOUT-04 | Side-by-side layout stacks vertically on tablet breakpoints (<1024px) | Tailwind `lg:grid-cols-2` breakpoint (1024px); single column default |
| HLGT-02 | Essay passages are always color-coded by feedback category in the results view | `buildSegments()` utility + `HighlightedEssay` component rendering `<mark>` elements with category colors |
| HLGT-03 | Clicking a feedback card scrolls the essay panel to the relevant highlighted passage | `data-highlight-id` attributes on marks + `scrollIntoView({ behavior: "smooth", block: "center" })` |
| HLGT-04 | Category color legend is visible with toggles to show/hide highlighting per category | `ColorLegend` component reading category colors + toggle state in HighlightContext |
| HLGT-05 | Hovering a feedback card pulses/intensifies the corresponding essay highlight, and vice versa | Scoped React context for `activeCategoryId`; CSS transition on opacity; Motion `animate` for pulse effect |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | Component rendering, context API, useRef for scroll targets | Already installed; context API is the right tool for scoped ephemeral state |
| Tailwind CSS | ^4.2.1 | Grid layout, responsive breakpoints, highlight colors | Already installed; `lg:grid-cols-2` handles the 1024px breakpoint natively |
| Motion | ^12.35.1 | Pulse animation on highlight hover | Already installed from Phase 8; lightweight use for opacity/scale pulse |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | ^5.0.11 | Read `currentResult` with essay text and highlights | Already in use; no new store fields needed for this phase |
| Lucide React | ^0.577.0 | Toggle icons for color legend | Already installed; `Eye`/`EyeOff` icons for category toggles |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Grid split-pane | react-split-pane library | Over-engineered; requirements explicitly exclude resizable/draggable panes (Out of Scope in REQUIREMENTS.md) |
| React context for hover state | Zustand store | Zustand is overkill for ephemeral hover state scoped to one view; context avoids polluting global store |
| Manual `<mark>` rendering | react-highlight-words library | Library is designed for search-term highlighting, not category-based offset ranges; custom is simpler here |

**Installation:**
```bash
# No new dependencies needed -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── results/
│   │   ├── CategoryFeedback.tsx    # MODIFIED: add hover/click handlers, color accent
│   │   ├── ColorLegend.tsx         # NEW: category color legend with toggles
│   │   ├── EssayPanel.tsx          # NEW: left panel with highlighted essay + scroll container
│   │   ├── FeedbackPanel.tsx       # NEW: right panel with summary + scores + feedback cards
│   │   ├── HighlightedEssay.tsx    # NEW: renders essay text with <mark> spans
│   │   ├── ResultsSummary.tsx      # unchanged
│   │   ├── ScoreBar.tsx            # unchanged
│   │   └── ScoreOverview.tsx       # unchanged
│   └── grading/
│       └── ...                     # unchanged
├── lib/
│   ├── highlight-utils.ts          # NEW: buildSegments(), sortHighlights(), color palette
│   ├── highlight-context.tsx       # NEW: HighlightProvider + useHighlightContext
│   └── score-utils.ts              # unchanged
├── pages/
│   └── GradingPage.tsx             # MODIFIED: results branch becomes split-pane layout
```

### Pattern 1: Segment Builder (Pure Function)
**What:** Converts raw essay text + highlight ranges into an ordered array of renderable segments (plain text or highlighted spans).
**When to use:** Any time you need to render text with inline annotations based on character offsets.
**Example:**
```typescript
// src/lib/highlight-utils.ts

export interface TextSegment {
  type: "text";
  content: string;
}

export interface HighlightSegment {
  type: "highlight";
  content: string;
  categoryId: string;
  highlightType: "strength" | "improvement";
  /** Unique ID for scroll targeting: `${categoryId}-${index}` */
  id: string;
}

export type Segment = TextSegment | HighlightSegment;

/**
 * Build renderable segments from essay text and highlight ranges.
 * Highlights MUST NOT overlap (enforced by mock data design).
 * Segments are sorted by offset position in the essay.
 */
export function buildSegments(
  essayText: string,
  highlights: HighlightRange[],
  disabledCategories: Set<string> = new Set(),
): Segment[] {
  // Filter out disabled categories
  const active = highlights
    .filter((h) => !disabledCategories.has(h.categoryId))
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const hl of active) {
    // Plain text before this highlight
    if (hl.start > cursor) {
      segments.push({ type: "text", content: essayText.slice(cursor, hl.start) });
    }
    // Highlighted segment
    segments.push({
      type: "highlight",
      content: essayText.slice(hl.start, hl.end),
      categoryId: hl.categoryId,
      highlightType: hl.type,
      id: `${hl.categoryId}-${hl.start}`,
    });
    cursor = hl.end;
  }

  // Trailing plain text
  if (cursor < essayText.length) {
    segments.push({ type: "text", content: essayText.slice(cursor) });
  }

  return segments;
}
```

### Pattern 2: Category Color Palette
**What:** Deterministic color mapping from category ID to highlight colors. Must be distinct from score colors (emerald/amber/rose) already used in ScoreBar.
**When to use:** Anywhere a category needs a visual color identity (highlights, legend, feedback card accents).
**Example:**
```typescript
// src/lib/highlight-utils.ts

export interface CategoryColor {
  /** Tailwind bg class for <mark> elements */
  bg: string;
  /** Stronger bg for active/hovered state */
  bgActive: string;
  /** Text color for legend labels */
  text: string;
  /** Human-readable name */
  name: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { bg: "bg-blue-100",   bgActive: "bg-blue-200",   text: "text-blue-700",   name: "Blue" },
  { bg: "bg-purple-100", bgActive: "bg-purple-200", text: "text-purple-700", name: "Purple" },
  { bg: "bg-orange-100", bgActive: "bg-orange-200", text: "text-orange-700", name: "Orange" },
  { bg: "bg-teal-100",   bgActive: "bg-teal-200",   text: "text-teal-700",   name: "Teal" },
  { bg: "bg-pink-100",   bgActive: "bg-pink-200",   text: "text-pink-700",   name: "Pink" },
  { bg: "bg-yellow-100", bgActive: "bg-yellow-200", text: "text-yellow-700", name: "Yellow" },
];

/** Get color for a category by its index in the categories array */
export function getCategoryColor(index: number): CategoryColor {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/** Build a map from categoryId to color index for fast lookup */
export function buildCategoryColorMap(
  categories: CategoryScore[]
): Map<string, number> {
  return new Map(categories.map((cat, i) => [cat.id, i]));
}
```

### Pattern 3: Scoped Highlight Context
**What:** React context providing hover/active state shared between essay panel and feedback panel.
**When to use:** When two sibling components need to communicate ephemeral interaction state without global store pollution.
**Example:**
```typescript
// src/lib/highlight-context.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface HighlightContextValue {
  /** Currently hovered category ID (null = nothing hovered) */
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  /** Set of category IDs whose highlights are hidden via legend toggles */
  disabledCategories: Set<string>;
  toggleCategory: (categoryId: string) => void;
  /** Scroll target: highlight ID to scroll to (null = no scroll request) */
  scrollTarget: string | null;
  setScrollTarget: (id: string | null) => void;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(new Set());
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const toggleCategory = useCallback((categoryId: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  return (
    <HighlightContext.Provider
      value={{
        activeCategoryId,
        setActiveCategoryId,
        disabledCategories,
        toggleCategory,
        scrollTarget,
        setScrollTarget,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlightContext() {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error("useHighlightContext must be used within HighlightProvider");
  return ctx;
}
```

### Pattern 4: Split-Pane Layout with Independent Scroll
**What:** CSS Grid two-column layout where each panel scrolls independently, stacking on narrow screens.
**When to use:** Side-by-side content comparison views.
**Example:**
```typescript
// In GradingPage.tsx results branch
<HighlightProvider>
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold">Grading Results</h1>
    <Button variant="outline" onClick={handleReset}>Grade Another</Button>
  </div>
  <ColorLegend categories={currentResult.categories} />
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <EssayPanel result={currentResult} />
    <FeedbackPanel result={currentResult} />
  </div>
</HighlightProvider>
```

```typescript
// EssayPanel.tsx - independent scroll
function EssayPanel({ result }: { result: GradingResult }) {
  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="pt-6">
        <HighlightedEssay
          essayText={result.essayText}
          highlights={getAllHighlights(result.categories)}
          categories={result.categories}
        />
      </CardContent>
    </Card>
  );
}
```

### Pattern 5: Click-to-Scroll with scrollIntoView
**What:** Clicking a feedback card scrolls the essay panel to the first highlight for that category.
**When to use:** Cross-panel navigation in split-pane layouts.
**Example:**
```typescript
// In HighlightedEssay, each <mark> has a data attribute:
<mark
  id={`hl-${segment.id}`}
  data-category-id={segment.categoryId}
  className={...}
>
  {segment.content}
</mark>

// In CategoryFeedback, on click:
function handleCardClick(categoryId: string) {
  // Find the first highlight mark for this category
  const mark = document.querySelector(`[data-category-id="${categoryId}"]`);
  mark?.scrollIntoView({ behavior: "smooth", block: "center" });
}
```

### Pattern 6: Hover Pulse Animation
**What:** Hovering a feedback card pulses the corresponding highlights; hovering a highlight pulses the corresponding card.
**When to use:** Bidirectional visual linkage between related UI elements.
**Example:**
```typescript
// On each <mark> in HighlightedEssay:
const isActive = activeCategoryId === segment.categoryId;
const isDimmed = activeCategoryId !== null && !isActive;

<mark
  className={cn(
    "rounded-sm px-0.5 transition-all duration-200 cursor-pointer",
    getCategoryColor(colorIndex).bg,
    isActive && getCategoryColor(colorIndex).bgActive,
    isDimmed && "opacity-30",
  )}
  onMouseEnter={() => setActiveCategoryId(segment.categoryId)}
  onMouseLeave={() => setActiveCategoryId(null)}
>

// On CategoryFeedback card:
const isActive = activeCategoryId === category.id;
// Add a left border accent in category color + subtle scale on active
<Card
  className={cn(
    "transition-all duration-200 cursor-pointer",
    isActive && "ring-2 ring-offset-1",
  )}
  style={isActive ? { borderLeftColor: categoryAccent } : undefined}
  onMouseEnter={() => setActiveCategoryId(category.id)}
  onMouseLeave={() => setActiveCategoryId(null)}
  onClick={() => handleCardClick(category.id)}
>
```

### Anti-Patterns to Avoid
- **Overlapping highlight ranges:** The mock data already avoids this, but the segment builder should handle overlaps defensively. For this phase, enforce non-overlap in mock data; document that future backend must also avoid overlaps or the builder needs splitting logic.
- **contentEditable for highlighted text:** Never mix React-controlled rendering with contentEditable. This is a read-only highlighted view (editing is Phase 10 scope).
- **Storing hover state in Zustand:** Ephemeral hover state belongs in scoped React context, not the persisted global store.
- **Nesting `<mark>` inside `<mark>`:** If two categories highlight the same text, do NOT nest marks. Split into sub-segments. (Mock data avoids this.)
- **Using `window.scrollTo` instead of `element.scrollIntoView`:** The essay panel has its own scroll container; `window.scrollTo` would scroll the page, not the panel. Always use `scrollIntoView` on the target element within the scrollable container.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Split-pane layout | Custom resize/drag splitter | CSS Grid `grid-cols-2` | Requirements explicitly exclude resizable panes; 2 lines of Tailwind suffice |
| Smooth scroll to highlight | Manual scroll position calculation | `element.scrollIntoView({ behavior: "smooth", block: "center" })` | Browser API handles container scroll detection, offset calculation, and animation natively |
| Pulse animation | CSS keyframe from scratch | Motion `animate` prop or Tailwind `animate-pulse` with conditional class | Motion already installed; consistent with Phase 8 animation patterns |
| Responsive stacking | JavaScript resize observer | Tailwind `lg:` breakpoint prefix | CSS breakpoints are more performant and reliable than JS-based responsive logic |

**Key insight:** This phase is mostly about data transformation (highlight ranges to DOM segments) and layout (CSS Grid). The interaction layer (hover/click linkage) is lightweight React context. No complex new abstractions are needed.

## Common Pitfalls

### Pitfall 1: Highlight Offsets Misaligned with Displayed Text
**What goes wrong:** Highlights appear on wrong words or partially overlap incorrect text.
**Why it happens:** Character offsets in `HighlightRange` are computed against `mockEssayText` in `mock-data.ts`. If the essay text passed to `buildSegments` differs (e.g., trimmed, or different text entirely), offsets are wrong.
**How to avoid:** `GradingResult.essayText` already stores the original essay text alongside highlights. Always use `result.essayText` (not the store's `essayText` which may have been edited) when rendering highlights.
**Warning signs:** Highlights visually cut words in half or highlight whitespace.

### Pitfall 2: Scroll Target Inside Overflow Container
**What goes wrong:** `scrollIntoView` scrolls the entire page instead of just the essay panel.
**Why it happens:** The essay panel scroll container needs `overflow-y: auto` with a constrained height for `scrollIntoView` to scroll within it rather than the viewport.
**How to avoid:** Ensure `EssayPanel` has `lg:h-[calc(100vh-Xrem)] lg:overflow-y-auto` so it is the scroll container. Verify with devtools that the panel, not the body, scrolls.
**Warning signs:** Page jumps when clicking a feedback card instead of essay panel scrolling smoothly.

### Pitfall 3: Tailwind Purging Dynamic Color Classes
**What goes wrong:** Highlight colors don't appear in production builds.
**Why it happens:** Tailwind 4 scans source files for class names. If color classes are constructed dynamically (e.g., `bg-${color}-100`), they won't be found and will be purged.
**How to avoid:** Use complete static class strings in the `CATEGORY_COLORS` array (e.g., `"bg-blue-100"` not `"bg-" + name + "-100"`). This is already handled in the recommended pattern above.
**Warning signs:** Highlights appear unstyled in production but work in dev mode.

### Pitfall 4: Context Re-renders on Every Hover
**What goes wrong:** The entire results view re-renders on every mouse move over highlights.
**Why it happens:** Setting `activeCategoryId` in context triggers re-render of all context consumers.
**How to avoid:** (1) Memoize the `segments` array with `useMemo` so `HighlightedEssay` doesn't recompute segments on hover. (2) The actual DOM change is just CSS class toggling (opacity/bg), which is cheap. (3) If performance is an issue, split context into separate `ActiveCategoryProvider` and `DisabledCategoriesProvider` to isolate re-render scopes. For 4 categories with ~15 highlights, this optimization is likely unnecessary.
**Warning signs:** Jank/lag when hovering over highlights or cards.

### Pitfall 5: Stacked Layout Missing Scroll Behavior
**What goes wrong:** On mobile/tablet (<1024px), clicking a feedback card tries to scroll to a highlight that is above the feedback section in the stacked layout.
**Why it happens:** In stacked mode, both panels are in the same scroll flow. `scrollIntoView` will scroll the entire page.
**How to avoid:** This is actually fine -- in stacked mode, `scrollIntoView({ behavior: "smooth", block: "center" })` on the viewport is the correct behavior since both panels share the page scroll. Only in the side-by-side layout does the essay panel have its own scroll container.
**Warning signs:** None -- just be aware the scroll behavior differs between layouts.

### Pitfall 6: Flattening Highlights from Categories
**What goes wrong:** Passing `result.categories[0].highlights` instead of all categories' highlights to the segment builder.
**Why it happens:** Highlights live on each `CategoryScore`, not on `GradingResult` directly.
**How to avoid:** Create a utility `getAllHighlights(categories: CategoryScore[]): HighlightRange[]` that flatmaps all category highlights into a single sorted array.
**Warning signs:** Only one category's highlights appear in the essay.

## Code Examples

### Extracting All Highlights from Categories
```typescript
// src/lib/highlight-utils.ts
import type { CategoryScore, HighlightRange } from "@/api/types";

export function getAllHighlights(categories: CategoryScore[]): HighlightRange[] {
  return categories
    .flatMap((cat) => cat.highlights)
    .sort((a, b) => a.start - b.start);
}
```

### HighlightedEssay Component
```typescript
// src/components/results/HighlightedEssay.tsx
import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { buildSegments, getAllHighlights, buildCategoryColorMap, getCategoryColor } from "@/lib/highlight-utils";
import { useHighlightContext } from "@/lib/highlight-context";
import type { GradingResult } from "@/api/types";

interface HighlightedEssayProps {
  result: GradingResult;
}

export function HighlightedEssay({ result }: HighlightedEssayProps) {
  const { activeCategoryId, setActiveCategoryId, disabledCategories, scrollTarget, setScrollTarget } =
    useHighlightContext();

  const colorMap = useMemo(
    () => buildCategoryColorMap(result.categories),
    [result.categories]
  );

  const allHighlights = useMemo(
    () => getAllHighlights(result.categories),
    [result.categories]
  );

  const segments = useMemo(
    () => buildSegments(result.essayText, allHighlights, disabledCategories),
    [result.essayText, allHighlights, disabledCategories]
  );

  // Handle scroll-to target
  useEffect(() => {
    if (scrollTarget) {
      const el = document.getElementById(`hl-${scrollTarget}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollTarget(null);
    }
  }, [scrollTarget, setScrollTarget]);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }
        const colorIndex = colorMap.get(seg.categoryId) ?? 0;
        const color = getCategoryColor(colorIndex);
        const isActive = activeCategoryId === seg.categoryId;
        const isDimmed = activeCategoryId !== null && !isActive;

        return (
          <mark
            key={i}
            id={`hl-${seg.id}`}
            data-category-id={seg.categoryId}
            className={cn(
              "rounded-sm px-0.5 transition-all duration-200 cursor-pointer",
              color.bg,
              isActive && color.bgActive,
              isDimmed && "opacity-30",
            )}
            onMouseEnter={() => setActiveCategoryId(seg.categoryId)}
            onMouseLeave={() => setActiveCategoryId(null)}
          >
            {seg.content}
          </mark>
        );
      })}
    </div>
  );
}
```

### ColorLegend Component
```typescript
// src/components/results/ColorLegend.tsx
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/highlight-utils";
import { useHighlightContext } from "@/lib/highlight-context";
import type { CategoryScore } from "@/api/types";

interface ColorLegendProps {
  categories: CategoryScore[];
}

export function ColorLegend({ categories }: ColorLegendProps) {
  const { disabledCategories, toggleCategory } = useHighlightContext();

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {categories.map((cat, i) => {
        const color = getCategoryColor(i);
        const isDisabled = disabledCategories.has(cat.id);

        return (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity",
              color.bg,
              color.text,
              isDisabled && "opacity-40 line-through",
            )}
          >
            {isDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
```

### Modified GradingPage Results Branch
```typescript
// In GradingPage.tsx, replace the existing `if (currentResult)` block:
if (currentResult) {
  return (
    <HighlightProvider>
      <div className="mx-auto max-w-[1280px] space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grading Results</h1>
          <Button variant="outline" onClick={handleReset}>
            Grade Another
          </Button>
        </div>
        <ColorLegend categories={currentResult.categories} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EssayPanel result={currentResult} />
          <FeedbackPanel result={currentResult} />
        </div>
      </div>
    </HighlightProvider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline styles for highlight colors | Tailwind utility classes with static strings | Tailwind 3+ | Avoid dynamic class construction; use complete class names |
| `window.scrollTo` with offset calculation | `element.scrollIntoView({ behavior, block })` | Widely supported since 2020 | No manual math needed; respects scroll containers |
| Global state for all interaction | Scoped React Context for ephemeral UI state | React best practice | Prevents unnecessary global re-renders |

**Deprecated/outdated:**
- None relevant to this phase's technology choices

## Open Questions

1. **Highlight overlap handling**
   - What we know: Mock data carefully avoids overlapping ranges. The `buildSegments` function assumes non-overlapping sorted input.
   - What's unclear: Whether future real API data might produce overlaps.
   - Recommendation: For Phase 9, enforce non-overlap in mock data and document the constraint. Add a comment in `buildSegments` noting that overlap handling would require segment splitting if needed later.

2. **Exact panel height calculation**
   - What we know: Both panels need independent scroll with `lg:h-[calc(100vh-Xrem)]`.
   - What's unclear: The exact offset value depends on header height + legend + title bar spacing.
   - Recommendation: Start with `14rem` offset, fine-tune during implementation by visual inspection. This is a CSS constant, trivially adjustable.

3. **Bidirectional hover: highlight-to-card**
   - What we know: Hovering a feedback card highlights essay passages. The reverse (hovering an essay highlight pulses the corresponding card) is also required by HLGT-05.
   - What's unclear: How to visually indicate which card is "active" when hovering an essay highlight.
   - Recommendation: Add a colored left border or ring to the CategoryFeedback card when its category is active. Auto-expand the collapsible if it's collapsed (or just show the visual indicator on the header).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework configured |
| Config file | none -- see Wave 0 |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-03 | Side-by-side layout with essay left, feedback right | manual-only | Visual inspection in browser at >1024px width | N/A |
| LAYOUT-04 | Stacks vertically below 1024px | manual-only | Visual inspection at <1024px (browser devtools responsive mode) | N/A |
| HLGT-02 | Essay passages color-coded by category | manual-only | Visual inspection -- verify colored marks appear on essay text | N/A |
| HLGT-03 | Click feedback card scrolls to highlighted passage | manual-only | Click each category card, verify essay panel scrolls to corresponding highlight | N/A |
| HLGT-04 | Color legend with per-category toggles | manual-only | Click legend toggles, verify highlights appear/disappear per category | N/A |
| HLGT-05 | Hover feedback card pulses highlight (and vice versa) | manual-only | Hover card, verify essay highlights pulse; hover highlight, verify card indicates | N/A |

**Justification for manual-only:** All requirements involve visual rendering (color-coded highlights, CSS Grid layout, scroll behavior, hover interactions) that require browser interaction to verify. No test framework is currently installed. The `buildSegments` pure function could be unit-tested, but installing a test framework is out of scope for this phase.

### Sampling Rate
- **Per task commit:** `npm run build` (type-check + bundle -- catches import errors and type mismatches)
- **Per wave merge:** `npm run build` + manual visual inspection of all 6 requirements
- **Phase gate:** Build succeeds + visual verification of all interaction behaviors

### Wave 0 Gaps
None -- manual validation via build + visual inspection is appropriate. The `buildSegments` function is the most testable unit but framework installation is out of scope.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `src/api/types.ts` (HighlightRange already defined), `src/api/mock-data.ts` (highlights already populated with `hl()` helper), `src/pages/GradingPage.tsx` (current results rendering), `src/components/results/*` (existing result components)
- `.planning/research/ARCHITECTURE.md` -- prior architectural research covering split-pane, highlight context, and component tree design
- `.planning/STATE.md` -- decision log: "Scoped React context (not Zustand) for ephemeral hover-linking state"
- MDN Web Docs: `Element.scrollIntoView()` -- standard browser API, fully supported
- Tailwind CSS docs: `lg:` breakpoint = 1024px, `grid-cols-2` for two-column grid

### Secondary (MEDIUM confidence)
- React docs: Context API for scoped state sharing between siblings

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; all libraries already installed and in use
- Architecture: HIGH - Data model (HighlightRange on CategoryScore) already exists; architectural decisions documented in prior research
- Pitfalls: HIGH - Pitfalls are concrete and based on direct codebase analysis (offset alignment, scroll containers, Tailwind purging)

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable patterns, no external dependency changes)
