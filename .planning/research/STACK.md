# Technology Stack

**Project:** AI Essay Grader v1.1 UX Redesign
**Researched:** 2026-03-08
**Scope:** Stack additions for side-by-side layout, text highlighting, collapsible hero, and mock auth

## Existing Stack (validated, DO NOT change)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI framework |
| Vite | ^7.3.1 | Build tool |
| TypeScript | ~5.9.3 | Type safety |
| Tailwind CSS v4 | ^4.2.1 | Styling |
| Zustand | ^5.0.11 | State management (with persist middleware) |
| React Router | ^7.13.1 | Routing |
| @base-ui/react | ^1.2.0 | Unstyled component primitives |
| shadcn (base-nova) | ^4.0.2 | Component generation (uses Base UI) |
| tw-animate-css | ^1.4.0 | Tailwind animation utilities |
| lucide-react | ^0.577.0 | Icons |
| sonner | ^2.0.7 | Toast notifications |
| class-variance-authority | ^0.7.1 | Variant styling |
| clsx + tailwind-merge | latest | Class merging |

## Recommended Stack Additions

### Side-by-Side Layout: No new dependency needed

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS Grid / Flexbox | (native) | Side-by-side panel layout | The results view is a fixed 50/50 split (essay left, feedback right) -- not a user-resizable IDE-style layout. CSS Grid with `grid-template-columns: 1fr 1fr` handles this perfectly. Adding react-resizable-panels (or the shadcn Resizable wrapper) would introduce unnecessary complexity for a layout where users do not need to drag panel boundaries. |

**Confidence:** HIGH -- the PROJECT.md describes a side-by-side view, not a resizable split pane. A static two-column layout is trivially achievable with Tailwind's grid/flex utilities already in the project.

**If requirements change** to need user-resizable panels later, use `npx shadcn@latest add resizable` which wraps react-resizable-panels v4.7.x. The shadcn CLI is already configured in this project.

### Text Highlighting: Custom component (no library)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom `<HighlightedText>` component | N/A | Color-coded passage highlighting linked to feedback categories | The highlighting requirement is specific: always-on, color-coded by rubric category, with known character/word offset ranges from mock API data. This is a straightforward span-wrapping problem, not a general-purpose text annotation system. A ~50-line custom component that splits text into spans by offset ranges and applies Tailwind background color classes is simpler, more maintainable, and more controllable than any third-party library. |

**Confidence:** HIGH -- the requirement is well-scoped (mock API provides ranges, each range maps to a category color). No library adds value here.

**Implementation approach:**
1. Mock API responses include `highlights: Array<{ start: number; end: number; categoryId: string }>` per essay
2. A utility function splits essay text into segments (highlighted and non-highlighted) handling overlaps by priority
3. `<HighlightedText>` renders segments as `<span>` elements with category-specific Tailwind background colors (e.g., `bg-blue-100`, `bg-amber-100`, `bg-green-100`)
4. Each highlighted span gets a `data-category` attribute for CSS targeting and hover/tooltip behavior

**Why NOT react-highlight-words:** Designed for search-term matching, not arbitrary character ranges with category metadata. Wrong abstraction.

**Why NOT CSS Custom Highlight API:** Now supported in all modern browsers (Chrome 105+, Firefox 140+, Safari 17.2+), but it operates outside React's rendering model (imperative Range/Highlight API). For a React app where highlights are driven by state (feedback categories), declarative span-based rendering is the correct pattern. The CSS Highlight API is better suited for ephemeral highlights like find-in-page, not persistent category-linked annotations.

**Why NOT overlapping-markup:** Low maintenance, negligible community adoption, adds a dependency for what is a simple array-to-spans transform.

### Collapsible Hero Section: No new dependency needed

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Base UI Collapsible + tw-animate-css | (already installed) | Animated hero collapse on input focus | The project already has `@base-ui/react` Collapsible primitive AND a shadcn-generated `<Collapsible>` wrapper in `src/components/ui/collapsible.tsx`. The `tw-animate-css` package provides `accordion-down`/`accordion-up` animation utilities. Combined, these handle the hero collapse animation without any new dependency. |

**Confidence:** HIGH -- both components verified in the codebase.

**Implementation approach:**
1. Wrap hero section in `<Collapsible>` / `<CollapsibleContent>`
2. Control `open` state via Zustand (or local state) -- set to `false` when essay textarea receives focus
3. Apply `tw-animate-css` animation classes for smooth height transition
4. Use `data-[state=open]` / `data-[state=closed]` selectors for Tailwind transitions on opacity, transform

**Why NOT framer-motion/motion:** Adding a 45KB+ animation library (motion v12.35.1 is current) for a single collapse animation is overkill when the project already has CSS animation utilities and a Collapsible primitive. Motion is warranted when you need spring physics, layout animations, or gesture-driven interactions -- none of which apply to a hero collapse.

### Mock Authentication: No new dependency needed

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand persist middleware | (already installed) | Mock email+password auth state | The profile store (`src/stores/profile-store.ts`) already has `isSignedIn`, `email`, `signIn()`, and `signOut()` actions with localStorage persistence. Mock auth requires only: (1) a sign-in form component with email + password fields, (2) extending the store to accept password for validation display, and (3) conditional rendering based on `isSignedIn`. |

**Confidence:** HIGH -- verified the existing store code handles this pattern.

**Implementation approach:**
1. Add a `<SignInForm>` component using existing shadcn `<Input>` and `<Button>` components
2. Extend `useProfileStore.signIn()` to accept password (store it or just validate non-empty)
3. Profile page conditionally renders sign-in form vs. profile settings based on `isSignedIn`
4. No JWT, no tokens, no route guards -- just Zustand boolean state

**Why NOT any auth library (e.g., next-auth, clerk, firebase-auth):** This is explicitly mock authentication for a demo. Real auth is out of scope per PROJECT.md. A form + Zustand boolean is the correct level of abstraction.

## Summary: Zero New Dependencies

All four feature areas are achievable with the existing stack:

| Feature | Solution | New Dependency? |
|---------|----------|----------------|
| Side-by-side layout | Tailwind CSS Grid | No |
| Text highlighting | Custom `<HighlightedText>` component | No |
| Collapsible hero | Base UI Collapsible + tw-animate-css | No |
| Mock auth | Zustand store + form components | No |

This is the correct outcome for a v1.1 iteration on an already well-equipped stack. The existing tooling (React 19, Tailwind v4, Base UI, shadcn, Zustand with persistence, tw-animate-css) covers every new requirement without gaps.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Side-by-side layout | CSS Grid | react-resizable-panels v4.7.1 | Not a resizable layout; static 50/50 split suffices |
| Side-by-side layout | CSS Grid | shadcn Resizable | Same reason; just a wrapper around react-resizable-panels |
| Text highlighting | Custom spans | react-highlight-words | Wrong abstraction (search terms vs. character ranges with category metadata) |
| Text highlighting | Custom spans | CSS Custom Highlight API | Imperative API mismatches React's declarative model for state-driven highlights |
| Text highlighting | Custom spans | overlapping-markup | Low adoption; trivial to build custom |
| Hero animation | tw-animate-css + Collapsible | motion v12.35.1 | 45KB+ for one collapse animation; already have CSS animations |
| Mock auth | Zustand boolean | Firebase Auth / Clerk | Real auth explicitly out of scope |

## Installation

```bash
# No new packages to install.
# All v1.1 features use existing dependencies.
```

## Potential Future Additions (NOT for this milestone)

If the project later needs:
- **User-resizable panels:** `npx shadcn@latest add resizable` (wraps react-resizable-panels)
- **Complex animations (page transitions, drag-to-reorder):** `npm install motion` (v12.x)
- **Real authentication:** Evaluate when backend (FastAPI) is ready; likely JWT-based with Zustand + Axios interceptors
- **Server state caching:** TanStack Query when real API calls replace mocks

## Sources

- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) -- evaluated, v4.7.1 current; rejected for this use case
- [shadcn Resizable docs](https://ui.shadcn.com/docs/components/radix/resizable) -- available via CLI if needed later
- [tw-animate-css GitHub](https://github.com/Wombosvideo/tw-animate-css) -- collapsible animation docs confirmed
- [tw-animate-css collapsible docs](https://github.com/Wombosvideo/tw-animate-css/blob/main/docs/animations/collapsible.md) -- accordion-down/up animations verified
- [CSS Custom Highlight API MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API) -- evaluated; browser support confirmed (Chrome 105+, Firefox 140+, Safari 17.2+); rejected for React context
- [Motion npm](https://www.npmjs.com/package/motion) -- v12.35.1 current; evaluated and rejected for this scope
- [react-highlight-words GitHub](https://github.com/bvaughn/react-highlight-words) -- evaluated and rejected (wrong abstraction for range-based highlighting)
- [Can I Use: Highlight API](https://caniuse.com/mdn-api_highlight) -- browser support reference
