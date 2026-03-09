# Phase 8: Collapsible Hero & Grading Workspace - Research

**Researched:** 2026-03-08
**Domain:** React animation (Motion/framer-motion), layout transitions, UI state management
**Confidence:** HIGH

## Summary

Phase 8 adds a hero section to `GradingPage` that collapses when the user focuses on the essay textarea. The primary technical challenge is adding the Motion library (formerly framer-motion) and wiring `AnimatePresence` with exit animations to create a smooth collapse/reveal transition. The existing codebase is well-structured for this change: `GradingPage.tsx` is the sole modification target (plus a minor `onFocus` prop on `EssayInput`), and the Zustand store already holds `essayText` which can derive initial hero visibility.

The scope is narrow -- one new dependency (`motion`), one new component (Hero), and minor edits to two existing files. No routing, store schema, or layout changes beyond adding a `max-w` constraint to the workspace.

**Primary recommendation:** Install `motion`, create a `HeroSection` component using `AnimatePresence` + `motion.div` for enter/exit animations, and manage collapsed state as local React state in `GradingPage` (initialized from `essayText !== ""`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Title + one-line tagline only (e.g., "EssayGrader" + "AI-powered essay feedback in seconds")
- Medium banner height (~150-200px) -- grading inputs visible without scrolling
- Same background as workspace -- no gradient or tinted background, just whitespace separation
- Centered text alignment
- Triggered only by essay textarea focus -- no other interactions trigger collapse
- Hero hides entirely when collapsed -- header already shows branding, so a minimal bar would be redundant
- Stays collapsed until reset -- "Grade Another" click or page reload brings it back
- If essay text already exists (from Zustand persistence), hero starts collapsed -- returning users go straight to work
- Use Motion (framer-motion) library for animations
- Smooth slide up (~300ms) on collapse
- Symmetrical slide down to reveal on re-appear (reset)
- Workspace content smoothly shifts up in sync with hero collapse (AnimatePresence layout animation)
- Keep existing 2-column grid (essay left, rubric right) with submit button below
- Constrain workspace width (~1200px max) to prevent overly wide inputs on large monitors -- centered within full-width page
- Remove the "Grade Essay" heading -- hero title replaces it, and inputs are self-explanatory when hero is collapsed

### Claude's Discretion
- Exact tagline wording
- Motion animation configuration (spring vs tween, exact duration/easing)
- How to manage the collapsed state (React state, Zustand, or derived from essayText)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | Home page displays hero section with app title, description, and grading input area on a single page | Motion library for animation; HeroSection component pattern; GradingPage is already the home route |
| LAYOUT-02 | Hero section collapses to a minimal bar when user focuses on the essay input textarea | AnimatePresence exit animation pattern; onFocus callback on EssayInput textarea; local state for collapsed flag |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.35 | Collapse/reveal animations | The standard React animation library (rebranded from framer-motion); provides AnimatePresence for exit animations and layout prop for smooth content shifts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React (useState) | 19.x | Collapsed state management | Local UI state that resets on unmount/navigation -- simpler than Zustand for ephemeral view state |
| Zustand (useAppStore) | 5.x | Read essayText for initial state | Already in use; derive initial collapsed value from `essayText !== ""` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion | CSS transitions only | CSS can do slide-up, but AnimatePresence handles DOM removal gracefully; motion also future-proofs for Phase 9+ animations |
| Local React state | Zustand store | Collapsed state is ephemeral view state with no persistence need -- useState is simpler and sufficient |

**Installation:**
```bash
npm install motion
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── grading/
│       ├── HeroSection.tsx       # NEW: hero with title + tagline
│       ├── EssayInput.tsx        # MODIFIED: accept onFocus prop
│       └── RubricUpload.tsx      # unchanged
├── pages/
│   └── GradingPage.tsx           # MODIFIED: integrate hero, max-width, collapse logic
```

### Pattern 1: AnimatePresence for Conditional Rendering
**What:** Wrap the hero in `AnimatePresence` so it animates out when removed from the tree.
**When to use:** Any time a component needs exit animations before unmounting.
**Example:**
```typescript
// Source: motion.dev docs + community patterns
import { motion, AnimatePresence } from "motion/react";

function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const [heroCollapsed, setHeroCollapsed] = useState(essayText !== "");

  const handleEssayFocus = useCallback(() => {
    setHeroCollapsed(true);
  }, []);

  return (
    <div className="mx-auto max-w-[1200px]">
      <AnimatePresence>
        {!heroCollapsed && (
          <motion.div
            key="hero"
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <HeroSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grading workspace */}
      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput onFocus={handleEssayFocus} disabled={isGrading} />
        <RubricUpload disabled={isGrading} />
      </div>
    </div>
  );
}
```

### Pattern 2: Forwarding onFocus to Textarea
**What:** Pass an `onFocus` callback through `EssayInput` to its inner `<Textarea>`.
**When to use:** When a parent needs to react to a child's focus event.
**Example:**
```typescript
interface EssayInputProps {
  disabled?: boolean;
  onFocus?: () => void;
}

export function EssayInput({ disabled, onFocus }: EssayInputProps) {
  return (
    <Textarea
      onFocus={onFocus}
      // ...existing props
    />
  );
}
```

### Pattern 3: Reset Flow
**What:** "Grade Another" resets collapsed state alongside existing data clearing.
**When to use:** When user wants to start fresh.
**Example:**
```typescript
function handleReset() {
  clearCurrentResult();
  setEssayText("");
  setRubricFile(null);
  setHeroCollapsed(false); // Show hero again
}
```

### Anti-Patterns to Avoid
- **Animating height with CSS transitions on `auto`:** CSS cannot transition from a computed height to 0. Use Motion's `height: "auto"` support or animate with `overflow: hidden` + explicit height.
- **Putting AnimatePresence inside the conditional:** `AnimatePresence` must wrap the conditional, not be inside it. It needs to stay mounted to orchestrate exit animations.
- **Using layout prop on everything:** The `layout` prop is powerful but can cause unexpected jank if applied too broadly. For this phase, `AnimatePresence` with explicit enter/exit is cleaner than layout animations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exit animations | Manual height/opacity CSS with setTimeout + DOM removal | Motion's `AnimatePresence` + `exit` prop | Handles unmount timing, interruptible animations, and cleanup automatically |
| Height "auto" animation | JavaScript measuring + explicit pixel heights | Motion's `height: "auto"` in animate/exit | Handles resize observers and reflow internally |

**Key insight:** The core challenge (animate an element out of the DOM before removing it) is exactly what AnimatePresence was designed for. CSS alone cannot do this without JavaScript timing hacks.

## Common Pitfalls

### Pitfall 1: Initial Animation Flash
**What goes wrong:** Hero slides in on first page load even though user hasn't interacted yet.
**Why it happens:** `initial` defaults to the `animate` value on mount, causing a mount animation.
**How to avoid:** Set `initial={false}` on the motion.div when you don't want a mount animation, or set `initial` to match `animate` so there's no visible transition on mount.
**Warning signs:** Hero visibly slides down every time the page loads.

### Pitfall 2: Content Jump on Collapse
**What goes wrong:** Workspace content snaps up instantly instead of smoothly filling the space.
**Why it happens:** When the hero is removed from flow, the content below jumps up without transition.
**How to avoid:** Use `overflow-hidden` on the motion wrapper and animate `height` to 0. The content below will naturally flow up as the height shrinks. Alternatively, use Motion's `layout` prop on the workspace container.
**Warning signs:** Content teleports instead of sliding.

### Pitfall 3: Focus Triggering Collapse During Results View
**What goes wrong:** If the results view somehow triggers focus events, the hero state gets confused.
**Why it happens:** The `currentResult` conditional branch in GradingPage doesn't show the hero anyway.
**How to avoid:** The hero and onFocus handler only exist in the grading input branch (when `!currentResult`). Ensure collapsed state only matters in that branch.
**Warning signs:** N/A -- current code structure already handles this via the early return for results.

### Pitfall 4: Zustand essayText Persistence Mismatch
**What goes wrong:** Hero shows on reload even though essay text exists.
**Why it happens:** The current Zustand store only persists `history`, not `essayText` (see `partialize` in app-store.ts). So `essayText` resets to `""` on reload, and the hero always shows.
**How to avoid:** This is actually correct behavior per the user's decision ("page reload brings it back"). The `essayText !== ""` check is for in-session returns (e.g., navigating to Profile and back). On reload, essayText resets, hero shows. This matches the requirement.
**Warning signs:** None -- but document this decision for clarity.

## Code Examples

### HeroSection Component
```typescript
// New file: src/components/grading/HeroSection.tsx
export function HeroSection() {
  return (
    <section className="py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight">EssayGrader</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        AI-powered essay feedback in seconds
      </p>
    </section>
  );
}
```

### Complete Collapse Animation
```typescript
// Source: motion.dev docs (AnimatePresence pattern)
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence initial={false}>
  {!heroCollapsed && (
    <motion.div
      key="hero"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <HeroSection />
    </motion.div>
  )}
</AnimatePresence>
```

Note: `initial={false}` on `AnimatePresence` prevents the hero from animating in on first mount -- it just appears. The exit animation still fires normally when `heroCollapsed` becomes `true`.

### Max-Width Workspace Container
```typescript
// In GradingPage.tsx, wrap the entire grading content
<div className="mx-auto max-w-[1200px]">
  {/* Hero + grading inputs + submit button */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import from "framer-motion"` | `import from "motion/react"` | Nov 2024 | Package rebranded; new import path for new installs |
| `framer-motion` npm package | `motion` npm package | Nov 2024 | Both work, but new projects should use `motion` |
| Manual height measurement for collapse | `height: "auto"` in Motion | Motion v10+ | No need to measure DOM elements for height animations |

**Deprecated/outdated:**
- `framer-motion` package name: Still works but `motion` is the canonical package for new installs
- `import { motion } from "framer-motion"`: Use `import { motion } from "motion/react"` instead

## Open Questions

1. **Exact tagline wording**
   - What we know: User wants one-line tagline (e.g., "AI-powered essay feedback in seconds")
   - What's unclear: Final wording
   - Recommendation: Use "AI-powered essay feedback in seconds" as default; easy to change later (Claude's discretion)

2. **Spring vs tween for animation**
   - What we know: User wants ~300ms smooth slide
   - What's unclear: Whether spring or tween feels better
   - Recommendation: Use `tween` with `easeInOut` for predictable 300ms duration. Spring animations don't have fixed durations and can overshoot, which may feel odd for a collapse. (Claude's discretion)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework configured |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | Hero displays with title, tagline, and grading inputs on single page | manual-only | Visual inspection -- animation/layout rendering requires browser | N/A |
| LAYOUT-02 | Hero collapses on textarea focus, stays collapsed until reset | manual-only | Focus/animation behavior requires browser interaction | N/A |

**Justification for manual-only:** Both requirements involve visual animation behavior (Motion library transitions, DOM focus events, visual layout shifts) that cannot be meaningfully validated without a browser environment. No test framework is currently installed, and adding one is out of scope for this phase.

### Sampling Rate
- **Per task commit:** `npm run build` (type-check + bundle -- catches import errors and type mismatches)
- **Per wave merge:** `npm run build` + manual visual inspection
- **Phase gate:** Build succeeds + visual verification of collapse/reveal animation

### Wave 0 Gaps
None -- manual validation via build + visual inspection is appropriate for this animation-focused phase. No test infrastructure changes needed.

## Sources

### Primary (HIGH confidence)
- [motion GitHub README](https://github.com/motiondivision/motion) - Installation (`npm install motion`), import path (`motion/react`), current version (12.35.x)
- [motion.dev/docs/react-layout-animations](https://motion.dev/docs/react-layout-animations) - Layout animation patterns
- [motion.dev/docs/react](https://motion.dev/docs/react) - Getting started, motion component API

### Secondary (MEDIUM confidence)
- [Framer Motion Complete Guide 2026](https://inhaq.com/blog/framer-motion-complete-guide-react-nextjs-developers) - AnimatePresence code examples, exit animation patterns, LazyMotion optimization
- [Framer Motion rebrand announcement](https://motion.dev/blog/framer-motion-is-now-independent-introducing-motion) - Package rename context

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Motion is the de facto React animation library; version and API verified via npm and GitHub
- Architecture: HIGH - AnimatePresence pattern is well-documented and directly maps to the collapse/reveal requirement
- Pitfalls: HIGH - Common issues (initial flash, content jump, height auto) are well-known in the Motion community

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable library, low churn)
