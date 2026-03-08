# Phase 3: Submission Flow - Research

**Researched:** 2026-03-08
**Domain:** React form submission, async state management, programmatic navigation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Indeterminate spinner (not a progress bar) -- honest representation since we don't know actual progress
- Friendly loading copy -- warm, human-like tone (e.g., "Reviewing your work..." or "Reading through your essay...")
- Submit button must be disabled during grading to prevent double-clicks
- All inputs (essay textarea and rubric editor) must be locked/disabled during grading
- Spinner in the submit button while grading

### Claude's Discretion
- Loading animation placement (full-page overlay, inline near button, or dedicated loading view)
- Redirect approach (instant navigate vs brief success indicator before navigating)
- Whether to clear essay/rubric inputs after successful submission or preserve them for re-grading
- Error handling for API failures (skip, basic toast, or more robust -- mock API always succeeds)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUBM-01 | User can submit essay + rubric for grading | Existing `gradeEssay()` API, store actions `setCurrentResult()`/`addToHistory()`, GradingPage submit button -- all ready to wire |
| SUBM-02 | User sees loading animation during grading (simulated delay) | Lucide `Loader2` icon with `animate-spin`, local `isGrading` state controls UI lockdown |
| SUBM-03 | User is redirected to results page after grading completes | React Router `useNavigate()` for programmatic redirect, route needs `:id` parameter |
</phase_requirements>

## Summary

Phase 3 is a thin integration layer connecting already-built pieces. The `gradeEssay()` mock API exists with a 1500ms delay, the Zustand store has `setCurrentResult()` and `addToHistory()` actions, and the submit button is already rendered on GradingPage but lacks an onClick handler. The work is: (1) wire the button click to call the API, (2) manage a local `isGrading` boolean to show loading state and disable inputs, (3) store the result and navigate to `/results/:id`.

The router currently defines `/results` without an `:id` parameter. This needs to be updated to `/results/:id` so results can be addressed individually (required for Phase 5 history click-through). The ResultsPage currently renders static skeleton placeholders (Phase 4 scope) -- Phase 3 only needs the route to exist and accept navigation.

**Primary recommendation:** Use a local `isGrading` state in GradingPage (not Zustand) since loading state is UI-only and component-scoped. Pass `disabled={isGrading}` to EssayInput, RubricEditor, and the submit button. After `gradeEssay()` resolves, store the result, then `navigate(/results/${result.id})`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.0 | Component state (`useState`) for `isGrading` flag | Already installed |
| react-router | ^7.13.1 | `useNavigate()` for programmatic redirect | Already installed, used throughout app |
| zustand | ^5.0.11 | Store grading result and history | Already installed, store already has actions |
| lucide-react | ^0.577.0 | `Loader2` icon for spinner animation | Already installed, project icon library |
| sonner | ^2.0.7 | Toast notifications for error handling | Already installed, Toaster mounted in App.tsx |

### Supporting
No additional libraries needed. Everything required is already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local `useState` for `isGrading` | Zustand store `isGrading` | Unnecessary -- loading state is component-scoped, not shared. Local state is simpler and correct |
| Lucide `Loader2` + `animate-spin` | Custom CSS spinner | Over-engineering. Lucide + Tailwind `animate-spin` is the standard pattern for button spinners |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── GradingPage.tsx      # Add submission handler, loading state, input disabling
├── App.tsx                   # Update /results route to /results/:id
└── (no new files needed)
```

### Pattern 1: Async Submit with Loading State
**What:** Local `isGrading` state controls button spinner and input disabling during async operation
**When to use:** Single-component async operations where loading state doesn't need to be shared
**Example:**
```typescript
// GradingPage.tsx submission handler pattern
import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { gradeEssay } from "@/api/grading";
import { useAppStore } from "@/stores/app-store";

export function GradingPage() {
  const [isGrading, setIsGrading] = useState(false);
  const navigate = useNavigate();
  const essayText = useAppStore((s) => s.essayText);
  const rubricCategories = useAppStore((s) => s.rubricCategories);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const addToHistory = useAppStore((s) => s.addToHistory);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    setIsGrading(true);
    try {
      const result = await gradeEssay({
        essayText,
        rubric: rubricCategories,
      });
      setCurrentResult(result);
      addToHistory(result);
      navigate(`/results/${result.id}`);
    } catch {
      // Mock API never fails, but handle gracefully
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGrading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grade Essay</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput disabled={isGrading} />
        <RubricEditor disabled={isGrading} />
      </div>
      <Button disabled={isSubmitDisabled} size="lg" onClick={handleSubmit}>
        {isGrading ? (
          <>
            <Loader2 className="animate-spin" />
            Grading...
          </>
        ) : (
          "Submit for Grading"
        )}
      </Button>
    </div>
  );
}
```

### Pattern 2: Prop-Drilling `disabled` to Lock Inputs
**What:** Pass `disabled` prop to EssayInput and RubricEditor to lock all inputs during grading
**When to use:** When parent controls child interactivity temporarily
**Example:**
```typescript
// EssayInput needs to accept and forward disabled prop
interface EssayInputProps {
  disabled?: boolean;
}

export function EssayInput({ disabled }: EssayInputProps) {
  return (
    <div className={cn("space-y-4", disabled && "opacity-60 pointer-events-none")}>
      {/* existing content */}
    </div>
  );
}
```

### Pattern 3: Route Parameter for Results
**What:** Update route to accept dynamic ID so individual results can be deep-linked
**Example:**
```typescript
// App.tsx -- update route
<Route path="/results/:id" element={<ResultsPage />} />
```

### Anti-Patterns to Avoid
- **Storing `isGrading` in Zustand:** Loading state is UI-only and scoped to GradingPage. Putting it in global store adds unnecessary complexity and re-renders.
- **Not disabling inputs:** Users can modify essay/rubric during grading, leading to mismatch between what was submitted and what's displayed.
- **Navigating before storing result:** If you navigate before `setCurrentResult()`, the ResultsPage may render with null data for a flash.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spinner animation | Custom CSS keyframes | `Loader2` + Tailwind `animate-spin` | Standard pattern, consistent with project icon library |
| Toast notifications | Custom notification system | Sonner `toast()` | Already mounted in App.tsx, battle-tested |
| Route navigation | Manual `window.location` | React Router `useNavigate()` | Preserves SPA behavior, no page reload |

**Key insight:** This phase requires zero new dependencies. Every building block is already in the project.

## Common Pitfalls

### Pitfall 1: Double Submission
**What goes wrong:** User clicks submit multiple times, creating duplicate history entries
**Why it happens:** Button not disabled quickly enough, or async handler doesn't guard against re-entry
**How to avoid:** Set `isGrading = true` as the first line of the handler, and include `isGrading` in the `isSubmitDisabled` check
**Warning signs:** Multiple identical entries in history array

### Pitfall 2: Race Condition on Navigation
**What goes wrong:** Navigating to results before the store is updated, causing a flash of empty/null state
**Why it happens:** `navigate()` called before `setCurrentResult()` completes
**How to avoid:** Call `setCurrentResult(result)` and `addToHistory(result)` synchronously before `navigate()`. Zustand `set()` is synchronous, so this is safe as long as the order is correct.
**Warning signs:** ResultsPage briefly shows "no results" before data appears

### Pitfall 3: Forgetting to Reset Loading State on Error
**What goes wrong:** If the API call throws, `isGrading` stays `true` and the UI is permanently locked
**Why it happens:** No `finally` block or error handling
**How to avoid:** Always use try/finally to reset `isGrading`, or use try/catch/finally
**Warning signs:** Button stays in spinning state after an error

### Pitfall 4: Not Passing disabled to Child Components
**What goes wrong:** User can still type in textarea or edit rubric while grading is in progress
**Why it happens:** Only disabling the submit button, not the input components
**How to avoid:** Pass `disabled={isGrading}` to both EssayInput and RubricEditor, and implement the prop in those components
**Warning signs:** Text cursor still active in textarea during loading

### Pitfall 5: Friendly Loading Copy Not Showing
**What goes wrong:** Loading state only shows a spinner with no text, missing the locked decision for friendly copy
**Why it happens:** Forgetting the requirement for warm, human-like loading messages
**How to avoid:** Include text like "Reviewing your work..." alongside the spinner. Can rotate messages or keep static.
**Warning signs:** Visual-only spinner with no text context

## Code Examples

### Submit Handler with Full Error Handling
```typescript
async function handleSubmit() {
  setIsGrading(true);
  try {
    const result = await gradeEssay({
      essayText,
      rubric: rubricCategories,
    });
    setCurrentResult(result);
    addToHistory(result);
    navigate(`/results/${result.id}`);
  } catch {
    toast.error("Something went wrong. Please try again.");
  } finally {
    setIsGrading(false);
  }
}
```

### Button with Spinner and Loading Copy
```typescript
<Button disabled={isSubmitDisabled} size="lg" onClick={handleSubmit}>
  {isGrading ? (
    <>
      <Loader2 className="animate-spin" />
      Reviewing your work...
    </>
  ) : (
    "Submit for Grading"
  )}
</Button>
```

### Disabling Child Components
```typescript
// Wrapper approach -- add to existing component
<div className={cn("space-y-4", disabled && "opacity-60 pointer-events-none")}>
  {/* existing children unchanged */}
</div>
```

### Route Update
```typescript
// App.tsx -- before
<Route path="/results" element={<ResultsPage />} />

// App.tsx -- after
<Route path="/results/:id" element={<ResultsPage />} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useHistory()` from react-router v5 | `useNavigate()` from react-router v7 | React Router v6+ | Different API: `navigate('/path')` instead of `history.push('/path')` |
| `react-router-dom` package | `react-router` package | React Router v7 | Single package, this project already uses it correctly |

**Deprecated/outdated:**
- `useHistory()`: Replaced by `useNavigate()` in React Router v6+. This project already uses v7.

## Discretion Recommendations

### Loading Animation Placement
**Recommendation: Inline in the submit button + friendly overlay message**
- Place spinner inside the submit button (locked decision already requires this)
- Add a subtle overlay or centered loading message above the button area with rotating friendly copy (e.g., "Reading through your essay...", "Analyzing your rubric...", "Almost done...")
- Full-page overlay is heavy for a 1.5s wait. Inline button spinner + friendly text near the button is the right weight.

### Redirect Approach
**Recommendation: Instant navigate after result stored**
- 1.5s delay is already enough perceived wait time. Adding another delay for a "success" indicator makes the flow feel sluggish.
- Navigate immediately after storing the result. The results page appearing IS the success indicator.

### Input Preservation
**Recommendation: Preserve inputs after submission**
- Clearing inputs after submission is unexpected -- users may want to re-grade with minor rubric changes.
- Common UX pattern: form data persists until user explicitly clears it or starts a new session.
- Zustand store already persists `essayText` and `rubricCategories` across navigation by default.

### Error Handling
**Recommendation: Basic toast via Sonner**
- Mock API always succeeds, so error handling is defensive only.
- A simple `toast.error()` in the catch block is sufficient.
- Sonner is already mounted and configured in App.tsx.

## Open Questions

1. **Should ResultsPage read `currentResult` from store or fetch by ID?**
   - What we know: Phase 4 will build the results display. The store has `currentResult` which will be set before navigation. The route will have `:id` param.
   - What's unclear: Whether Phase 4 will also need to support direct URL access (fetching by ID for history click-through in Phase 5).
   - Recommendation: For Phase 3, just store the result and navigate. Phase 4/5 can add `getGradingResult(id)` fetch-by-ID if needed. Don't over-engineer now.

## Sources

### Primary (HIGH confidence)
- Project source code: `src/api/grading.ts`, `src/stores/app-store.ts`, `src/pages/GradingPage.tsx`, `src/App.tsx` -- direct code inspection
- Project `package.json` -- verified all dependency versions

### Secondary (MEDIUM confidence)
- React Router v7 `useNavigate()` API -- verified by project's existing usage of `react-router` v7.13.1
- Lucide React `Loader2` icon -- standard spinner icon in lucide-react library

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use, no new dependencies
- Architecture: HIGH -- straightforward integration of existing pieces, code patterns verified against project source
- Pitfalls: HIGH -- common React async patterns, well-documented failure modes

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no fast-moving dependencies)
