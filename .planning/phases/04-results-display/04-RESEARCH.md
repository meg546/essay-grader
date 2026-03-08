# Phase 4: Results Display - Research

**Researched:** 2026-03-08
**Domain:** React component composition, data visualization with Tailwind CSS, accessible accordion patterns
**Confidence:** HIGH

## Summary

Phase 4 replaces the skeleton placeholder in `ResultsPage.tsx` with a fully functional results display. The data model is already defined (`GradingResult` with `CategoryScore[]`), the store is wired (`useAppStore.currentResult`), and the routing is in place (`/results/:id`). This phase is purely presentational -- no API calls, no state management changes, no new dependencies needed.

The implementation requires four distinct UI sections: a summary card, color-coded score bars, an aggregate score display, and expandable per-category feedback sections. All of this can be built with the existing stack (Tailwind CSS v4, shadcn/ui Card components, lucide-react icons). The collapsible/accordion pattern should use the shadcn `Collapsible` component (built on Radix primitives via `@base-ui/react`) for accessibility.

**Primary recommendation:** Build 3-4 focused components (ScoreBar, CategoryFeedback, ResultsSummary) composed within ResultsPage. Use pure Tailwind for the score bar visualization (no charting library needed). Use shadcn Collapsible for the expand/collapse feedback sections. Define color thresholds as a simple utility function.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all areas are at Claude's discretion.

### Claude's Discretion
- **Score bar visualization**: Bar style, thickness, score label placement (inside bar vs beside), animation on load
- **Color coding thresholds**: What percentages map to green/yellow/red
- **Aggregate score display**: How prominent, where positioned, visual treatment
- **Feedback section design**: Accordion vs cards, collapsed vs expanded default, strengths/improvements/justification layout within each section
- **Results page layout**: Overall arrangement and spacing of summary, scores, and feedback sections
- **Empty/loading states**: What shows if no result is in the store (e.g., navigating directly to /results/:id)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RSLT-01 | User sees overall summary paragraph at top of results | Summary card component using existing Card/CardContent from shadcn; reads `currentResult.summary` |
| RSLT-02 | User sees per-category color-coded score bars (green/yellow/red) | Custom ScoreBar component with Tailwind width percentages and OKLCH color utility function |
| RSLT-03 | User sees aggregate/total score | Display `currentResult.overallScore` / `currentResult.maxScore`; prominent placement in summary card or dedicated section |
| RSLT-04 | User can expand/collapse per-category feedback sections | shadcn Collapsible component wrapping strengths/improvements/justification lists |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui Card | 4.0.2 | Summary card, feedback section containers | Already used project-wide, matches design system |
| shadcn/ui Collapsible | 4.0.2 | Expand/collapse feedback sections | Built on Radix, handles aria-expanded/aria-controls automatically |
| lucide-react | 0.577.0 | ChevronDown/ChevronUp icons for expand toggle | Already used throughout project |
| Tailwind CSS | 4.2.1 | Score bar widths, color coding, layout | Project's styling system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | via cn() | Conditional class composition | Color-coding logic on score bars |
| tw-animate-css | 1.4.0 | Subtle entrance animations on score bars | Already installed, use for bar fill animation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom score bars | recharts/chart.js | Massive overkill for simple horizontal bars; adds 50KB+ for something achievable with a single div |
| shadcn Collapsible | shadcn Accordion | Accordion enforces single-open behavior; Collapsible allows independent open/close per section (better UX for reviewing multiple categories) |
| CSS transitions | framer-motion | Project doesn't use framer-motion; CSS transitions handle bar fill animation perfectly |

**Installation:**
```bash
npx shadcn@latest add collapsible
```
This is the only new component needed. Everything else is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── results/
│       ├── ResultsSummary.tsx      # Summary paragraph + aggregate score card
│       ├── ScoreBar.tsx            # Single category score bar (reusable)
│       ├── ScoreOverview.tsx       # All score bars + aggregate display
│       └── CategoryFeedback.tsx    # Collapsible feedback for one category
├── lib/
│   └── score-utils.ts             # getScoreColor(), getScorePercentage()
└── pages/
    └── ResultsPage.tsx            # Composes all result components
```

### Pattern 1: Score Color Utility
**What:** A pure function mapping score percentage to a Tailwind-compatible color class.
**When to use:** Every score bar and potentially the aggregate score display.
**Example:**
```typescript
// src/lib/score-utils.ts
type ScoreColor = "green" | "yellow" | "red";

export function getScoreColor(score: number, maxScore: number): ScoreColor {
  const pct = score / maxScore;
  if (pct >= 0.7) return "green";
  if (pct >= 0.4) return "yellow";
  return "red";
}

// Map to actual Tailwind/OKLCH classes
export function getScoreBarClasses(color: ScoreColor): string {
  switch (color) {
    case "green": return "bg-emerald-500";   // high performance
    case "yellow": return "bg-amber-400";     // moderate performance
    case "red": return "bg-rose-500";         // needs improvement
  }
}
```

**Color thresholds rationale:**
- **70%+ = green**: Strong performance (e.g., 5/6 = 83%, 4/6 = 67% rounds to yellow)
- **40-69% = yellow**: Room for improvement (e.g., 3/6 = 50%)
- **Below 40% = red**: Significant issues (e.g., 2/6 = 33%)

These thresholds work well with the mock data: 5/6 scores get green, 4/6 gets yellow, which matches realistic educational expectations on a 6-point scale.

### Pattern 2: Score Bar with Inline Width
**What:** Horizontal bar using Tailwind's style prop for dynamic width (percentage).
**When to use:** Per-category score visualization.
**Example:**
```typescript
// src/components/results/ScoreBar.tsx
interface ScoreBarProps {
  name: string;
  score: number;
  maxScore: number;
}

export function ScoreBar({ name, score, maxScore }: ScoreBarProps) {
  const pct = Math.round((score / maxScore) * 100);
  const color = getScoreColor(score, maxScore);

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm font-medium truncate">{name}</span>
      <div className="relative h-6 flex-1 rounded-lg bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-lg transition-all duration-700 ease-out", getScoreBarClasses(color))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-sm font-semibold text-right">
        {score}/{maxScore}
      </span>
    </div>
  );
}
```

**Key detail:** Use `style={{ width }}` not Tailwind width classes. Tailwind purges dynamic class names like `w-[83%]` and the JIT approach with arbitrary values is unreliable for computed percentages. Inline style is the correct pattern.

### Pattern 3: Collapsible Feedback Section
**What:** Each category has a collapsible section showing strengths, improvements, and justification.
**When to use:** Per-category detailed feedback display.
**Example:**
```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface CategoryFeedbackProps {
  category: CategoryScore;
}

export function CategoryFeedback({ category }: CategoryFeedbackProps) {
  const [open, setOpen] = useState(false);
  const color = getScoreColor(category.score, category.maxScore);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <CardTitle>{category.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{category.score}/{category.maxScore}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Strengths, Improvements, Justification sections */}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
```

### Pattern 4: Empty State / Direct Navigation Guard
**What:** Handle the case where a user navigates directly to `/results/:id` without data in the store.
**When to use:** ResultsPage mount.
**Example:**
```typescript
const { id } = useParams();
const currentResult = useAppStore((s) => s.currentResult);

// If no result in store (direct navigation), redirect to grading page
if (!currentResult) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-muted-foreground">No grading result found.</p>
      <Button asChild>
        <Link to="/grade">Grade an Essay</Link>
      </Button>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Dynamic Tailwind class names for widths:** Never do `w-[${pct}%]` -- Tailwind cannot detect dynamic class names at build time. Use inline `style={{ width }}` instead.
- **Single accordion for feedback:** Using `<Accordion>` forces only one category open at a time. Users reviewing grading results want to compare multiple categories simultaneously. Use independent `Collapsible` components.
- **Charting libraries for score bars:** Adding recharts or chart.js for simple horizontal bars adds unnecessary bundle size and complexity. A styled div with percentage width is simpler, faster, and more customizable.
- **Hardcoded color values:** Don't use raw hex/oklch in component code. Use Tailwind's semantic color classes (emerald, amber, rose) so dark mode compatibility comes free.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expand/collapse with animation | Custom useState + height animation | shadcn Collapsible | Handles ARIA attributes, keyboard navigation, smooth height animation out of the box |
| Score percentage calculation | Inline math scattered everywhere | `score-utils.ts` utility | Single source of truth for thresholds, easy to adjust later |
| Card layout with header/content | Custom div nesting | shadcn Card/CardHeader/CardContent | Already used in project, consistent styling |

**Key insight:** This phase is entirely presentational. Every piece of data is already available in the Zustand store. The complexity is in making it look good and be accessible, not in data fetching or state management.

## Common Pitfalls

### Pitfall 1: Dynamic Tailwind Classes Getting Purged
**What goes wrong:** Score bars render with zero width because Tailwind purges `w-[83%]` style classes it can't statically detect.
**Why it happens:** Tailwind v4 scans source files for class names at build time. Dynamically constructed strings like template literals are invisible to the scanner.
**How to avoid:** Use inline `style={{ width: `${pct}%` }}` for any computed dimension. Reserve Tailwind classes for static, known values only.
**Warning signs:** Bars look correct in dev but break in production build.

### Pitfall 2: Color Accessibility
**What goes wrong:** Red/green color coding is invisible to colorblind users (~8% of males).
**Why it happens:** Relying solely on hue to communicate score quality.
**How to avoid:** Always pair color with a text label (the score fraction `4/6`) and use sufficiently different luminance values between the three colors. The score number beside each bar provides the redundant non-color signal.
**Warning signs:** Remove color from the page -- can users still understand the data?

### Pitfall 3: Collapsible Content Layout Shift
**What goes wrong:** Page jumps and reflowing when expanding/collapsing feedback sections, especially if sections at the top push content below the viewport.
**Why it happens:** Height changes without smooth transitions cause jarring layout shifts.
**How to avoid:** shadcn Collapsible handles CSS animation for height transitions. Keep cards in a stable flex/grid layout so expanding one card doesn't cause horizontal reflow.
**Warning signs:** Visual "jumping" when clicking expand/collapse.

### Pitfall 4: Missing Empty State
**What goes wrong:** User bookmarks a results URL or refreshes the page; the Zustand store is empty (no persistence configured); page shows broken/empty UI.
**Why it happens:** `currentResult` defaults to `null` in the store. No data fetching from URL params.
**How to avoid:** Check for null `currentResult` and show a friendly empty state with navigation back to the grading page. Phase 5 will add history lookup by ID, but for now a simple empty state is correct.
**Warning signs:** Navigating directly to `/results/some-id` shows blank content.

## Code Examples

### ResultsPage Composition
```typescript
// src/pages/ResultsPage.tsx
import { useAppStore } from "@/stores/app-store";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export function ResultsPage() {
  const currentResult = useAppStore((s) => s.currentResult);

  if (!currentResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">No grading result found.</p>
        <Button asChild>
          <Link to="/grade">Grade an Essay</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grading Results</h1>
      <ResultsSummary result={currentResult} />
      <ScoreOverview categories={currentResult.categories} />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Detailed Feedback</h2>
        {currentResult.categories.map((cat) => (
          <CategoryFeedback key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
```

### Score Color Utility (Complete)
```typescript
// src/lib/score-utils.ts
export type ScoreLevel = "high" | "medium" | "low";

export function getScoreLevel(score: number, maxScore: number): ScoreLevel {
  if (maxScore === 0) return "low";
  const pct = score / maxScore;
  if (pct >= 0.7) return "high";
  if (pct >= 0.4) return "medium";
  return "low";
}

export function getScoreBarColor(level: ScoreLevel): string {
  switch (level) {
    case "high": return "bg-emerald-500";
    case "medium": return "bg-amber-400";
    case "low": return "bg-rose-500";
  }
}

export function getScoreTextColor(level: ScoreLevel): string {
  switch (level) {
    case "high": return "text-emerald-700";
    case "medium": return "text-amber-600";
    case "low": return "text-rose-600";
  }
}
```

### Aggregate Score Display
```typescript
// Inside ResultsSummary.tsx
const level = getScoreLevel(result.overallScore, result.maxScore);
const pct = Math.round((result.overallScore / result.maxScore) * 100);

<div className="flex items-baseline gap-2">
  <span className={cn("text-4xl font-bold", getScoreTextColor(level))}>
    {result.overallScore}
  </span>
  <span className="text-lg text-muted-foreground">/ {result.maxScore}</span>
  <span className={cn("text-sm font-medium", getScoreTextColor(level))}>
    ({pct}%)
  </span>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radix UI Collapsible directly | shadcn Collapsible (wraps Radix/@base-ui) | shadcn v4 (2025) | Use `npx shadcn add collapsible` instead of raw Radix imports |
| Tailwind v3 JIT arbitrary values | Tailwind v4 with CSS-first config | 2025 | Same pattern for inline styles; utility classes work identically |
| React state for accordion | Collapsible with independent state per section | N/A | Better UX for multi-section review vs single-open accordion |

**Deprecated/outdated:**
- shadcn v3 import paths (`@/components/ui/collapsible` is still correct in v4, but installation uses `npx shadcn@latest`)

## Open Questions

1. **Collapsible default open state**
   - What we know: Collapsed by default reduces visual overwhelm; first category could default open to teach the interaction
   - What's unclear: User preference -- all collapsed or first expanded?
   - Recommendation: Default all collapsed. The score bars above give the quick overview; expanding is for deep dives. This is at Claude's discretion per CONTEXT.md.

2. **Aggregate score placement**
   - What we know: Can go in the summary card (compact) or as a separate prominent section (eye-catching)
   - What's unclear: Which is better for the educational context
   - Recommendation: Place aggregate score prominently within the summary card -- keeps the top of the page as the "at a glance" section. Score displayed large with colored text, summary paragraph below it.

## Sources

### Primary (HIGH confidence)
- Project source code: `src/api/types.ts`, `src/api/mock-data.ts`, `src/stores/app-store.ts`, `src/pages/ResultsPage.tsx` -- data model and existing patterns verified directly
- Project `src/index.css` -- OKLCH theme variables and dark mode setup confirmed
- Project `package.json` -- all dependencies verified (shadcn 4.0.2, lucide-react 0.577.0, tw-animate-css 1.4.0)
- shadcn/ui Card component source -- verified Card/CardHeader/CardTitle/CardContent/CardFooter API from project code

### Secondary (MEDIUM confidence)
- shadcn Collapsible component -- based on project's existing shadcn v4 setup using `@base-ui/react`; `npx shadcn@latest add collapsible` is the standard installation method
- Tailwind v4 dynamic class purging behavior -- well-documented pattern; inline styles for computed values is the standard recommendation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies needed, everything verified in project source
- Architecture: HIGH - straightforward component composition following established project patterns
- Pitfalls: HIGH - dynamic Tailwind classes and empty states are well-known React/Tailwind patterns

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving dependencies)
