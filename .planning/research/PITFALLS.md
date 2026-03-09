# Domain Pitfalls

**Domain:** UX redesign of React essay grading app (side-by-side layout, text highlighting, collapsible hero, mock auth)
**Researched:** 2026-03-08
**Confidence:** HIGH (pitfalls derived from direct codebase analysis against planned features)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: max-w-[960px] Layout Container Blocks Side-by-Side Results

**What goes wrong:** The current `Layout.tsx` wraps all page content in `max-w-[960px]`. A side-by-side view (essay left + feedback right) inside a 960px container leaves each pane at roughly 450px -- too narrow for readable essay text alongside detailed feedback cards with score bars and collapsible sections.

**Why it happens:** Developers add the split pane inside the existing layout without adjusting the container width, because the container is defined in a shared Layout component and changing it feels risky.

**Consequences:** Essay text gets squeezed into a narrow column with excessive line wrapping. Feedback panel has horizontal overflow or truncated score bars. The "polished QuillBot-style" side-by-side goal is missed entirely.

**Warning signs:** Essay pane feels like a sidebar rather than a primary reading area. Score bars in the feedback panel overflow or wrap awkwardly.

**Prevention:** The grading results view must break out of the shared `max-w-[960px]` container. Either (a) the Layout component accepts a `wide` prop that conditionally uses `max-w-[1280px]` or removes the constraint, or (b) the results view renders outside the `<Outlet />` container via a portal or layout route restructure. The GradingPage already conditionally renders input vs. results (`if (currentResult)`) -- use that branch to switch layout width.

**Detection:** Visually test at 1280px and 1440px viewport widths early. If either pane is under 500px usable width, the container is too narrow.

**Phase:** Must be addressed at the very start of the side-by-side layout work -- before building any split-pane components.

---

### Pitfall 2: Text Highlighting Breaks on Fuzzy/Partial String Matching

**What goes wrong:** The mock API returns passage references (text snippets linked to feedback categories), but finding and highlighting those passages in the essay text fails silently. Whitespace differences, minor edits, or substring ambiguity (the same phrase appears twice) cause highlights to land on wrong text or not appear at all.

**Why it happens:** Naive `string.indexOf()` matching is brittle. The essay text in the textarea and the passage strings from the API may differ in whitespace, line breaks, or Unicode normalization. The planned "editable essay with resubmit" feature makes this worse -- previously matched passages shift or disappear after edits.

**Consequences:** Highlights are missing or misaligned. Users see feedback referencing passages with no corresponding highlight. Trust in the tool drops immediately.

**Warning signs:** Highlights work perfectly with your handcrafted mock data but break when pasting real essays with varied formatting.

**Prevention:**
1. Design the mock API response to return character offset ranges (`{ start: number, end: number, categoryIndex: number }`) rather than raw text snippets. Offset-based highlighting is deterministic and avoids string matching entirely.
2. The current `CategoryScore` type in `api/types.ts` has no passage reference fields at all -- this schema change is a prerequisite before any UI work.
3. For the "editable essay with resubmit" feature, treat editing as invalidating existing highlights. Show a "Re-grade to update highlights" prompt rather than trying to dynamically recompute offsets after user edits.

**Detection:** Test with essays containing repeated phrases, em-dashes vs. hyphens, smart quotes, and multi-line paragraphs early.

**Phase:** Must be addressed during mock API type redesign, before building any highlight UI.

---

### Pitfall 3: Overlapping Highlights Create Visual Chaos

**What goes wrong:** Multiple feedback categories reference overlapping or adjacent essay passages. With 4 categories color-coded simultaneously ("always-on" per requirements), overlapping regions become unreadable -- the innermost span's background color wins, creating inconsistent visual signals.

**Why it happens:** CSS `background-color` on nested `<span>` elements does not compose. Developers discover this late because initial mock data conveniently has non-overlapping passages.

**Consequences:** The "always-on color-coded highlighting" feature looks broken or ugly at overlapping regions. One category's color silently overrides another's.

**Warning signs:** Mock data avoids overlaps so everything looks fine. The problem only surfaces with realistic passage ranges.

**Prevention:**
1. Design the mock data model so passages do not overlap -- each character belongs to at most one category. Enforce this constraint in the mock API. This is the simplest approach and matches realistic backend behavior (a model assigning non-overlapping spans).
2. If overlaps must be supported later, use absolutely-positioned translucent layers behind the text rather than inline span backgrounds.
3. Define a category priority order for deterministic conflict resolution.

**Detection:** Add a mock essay with intentionally adjacent and overlapping passage ranges during early testing.

**Phase:** Address during mock API data design, before building the highlight rendering component.

---

### Pitfall 4: Collapsible Hero Animation Conflicts with Page State Transitions

**What goes wrong:** The hero section should collapse when the user focuses on essay input, stay collapsed while viewing results, and re-expand on a fresh grading state. Developers implement the collapse as a CSS transition but fail to coordinate it with the application state machine. The hero re-animates on every render, flickers during route transitions, or gets stuck collapsed after clicking "Grade Another."

**Why it happens:** Hero collapse is visual state driven by application state (has the user started interacting? are results showing?). The current `GradingPage` uses a conditional render (`if (currentResult) { ... }`) which causes a full re-mount, re-triggering any mount-based animations. Mixing CSS animation triggers with React state and React Router navigation creates timing conflicts.

**Consequences:** Janky collapse/expand animations. Hero flashes open then immediately collapses when navigating back. Layout shift pushes content around during animation.

**Warning signs:** The hero animates correctly on first interaction but behaves unexpectedly after navigating away and back, or after grading completes and the user clicks "Grade Another."

**Prevention:**
1. Derive hero visibility from a single source of truth: `collapsed = essayText.length > 0 || currentResult !== null`. Do NOT use a separate `useState` for hero visibility.
2. Use CSS `max-height` + `overflow: hidden` + `transition` for the collapse, NOT conditional rendering (`{showHero && <Hero />}`). Conditional rendering prevents exit animations and causes layout jumps.
3. Better yet, use CSS grid with `grid-template-rows: 1fr` transitioning to `grid-template-rows: 0fr` -- this animates cleanly without needing to guess a max-height value and is well-supported in all modern browsers.
4. Add `pointer-events-none` to the hero during collapse transition to prevent interaction with partially-visible content.

**Detection:** Test the full navigation cycle: land on page -> type in essay -> hero collapses -> submit -> see results -> click "Grade Another" -> hero should re-expand smoothly. Also test: navigate to Profile and back.

**Phase:** Build the collapsible hero before integrating the side-by-side results layout. Get the animation right in isolation first.

## Moderate Pitfalls

### Pitfall 5: Split Pane Does Not Stack Properly on Tablet

**What goes wrong:** The side-by-side layout uses `md:` (768px) as the breakpoint for switching to two columns. On tablets (the minimum supported viewport per project constraints), both panes are crammed into 768px, leaving roughly 350px per pane -- unreadable for essay text.

**Why it happens:** Developers reach for Tailwind's `md:` breakpoint by habit. The existing grading page already uses `md:grid-cols-2` for essay/rubric input, which works because those are compact form inputs, not full reading panes with highlighted text and score bars.

**Prevention:** Use `lg:` (1024px) as the breakpoint for the side-by-side results layout. Below 1024px, stack the essay above feedback vertically. The existing input form can keep its `md:` two-column layout. Test at exactly 1024px to verify both panes have adequate width.

**Detection:** Resize browser to the 768px-1024px range during development. If either pane is under 480px, it should be stacking instead.

**Phase:** Address when building the split-pane container component.

---

### Pitfall 6: Bidirectional Scroll Sync Creates Infinite Loop

**What goes wrong:** When the essay is long, both panes scroll independently. Developers try to sync scrolling (clicking feedback scrolls essay to highlight, scrolling essay highlights active feedback) but bidirectional sync causes a scroll fight -- each pane triggers the other's scroll handler in a loop.

**Why it happens:** The intuitive desire is "feedback and essay should stay in sync." Bidirectional scroll sync requires complex debouncing with `isScrolling` ref flags, which is fragile and prone to race conditions.

**Prevention:** Implement one-directional scroll linking only: clicking or hovering a feedback category scrolls the essay pane to the relevant highlighted passage using `scrollIntoView({ behavior: 'smooth', block: 'center' })`. Do NOT try to update the feedback panel based on essay scroll position. This is simpler and more predictable.

**Detection:** If you find yourself adding `isScrolling` ref flags to debounce scroll handlers, you have fallen into this trap.

**Phase:** Address after both panes render correctly with static content. Scroll linking is a polish feature, not structural.

---

### Pitfall 7: Mock Auth Accidentally Gates the Core Grading Flow

**What goes wrong:** Mock authentication is added with protected route wrappers that redirect unauthenticated users to a sign-in page. This blocks the grading feature -- the entire point of the app -- behind a fake sign-in form. Demo viewers must create fake credentials before seeing the actual product.

**Why it happens:** Developers cargo-cult real auth patterns (`<ProtectedRoute>`, redirect-to-login) for what is explicitly a mock/demo feature. The project requirements say "mock email+password authentication on profile page" -- not "gate the entire app behind auth."

**Consequences:** The grading feature is unusable without first signing into a fake system. The app's core value proposition is hidden behind friction.

**Warning signs:** You are writing a `<ProtectedRoute>` component. You are adding auth checks to the Home or grading routes.

**Prevention:**
1. Mock auth should ONLY affect the Profile page. The grading flow must work without signing in.
2. The `profile-store.ts` already has `isSignedIn` -- use it to conditionally show "Sign in to save preferences" on the Profile page, not to redirect away from other routes.
3. Do NOT add `<Navigate to="/login" />` guards on Home or grading routes.
4. The sign-in screen should remain a section within the Profile page (which it already is), not a separate route. The redesign adds a password field -- keep it in-page.

**Detection:** Can a first-time visitor grade an essay without signing in? If no, auth scope has leaked.

**Phase:** Mock auth should be one of the last features implemented, after the core grading UX redesign is solid.

---

### Pitfall 8: Highlight Colors Have Poor Contrast in Dark Mode

**What goes wrong:** Category highlight colors are chosen for visual distinctiveness in light mode (blue, green, yellow, pink backgrounds), but the highlighted text becomes unreadable in dark mode. Solid pastel backgrounds like `bg-blue-200` clash with dark mode text colors.

**Why it happens:** Developers test with one theme on one monitor. The app uses `next-themes` for dark mode support, but highlight colors are hardcoded for light backgrounds.

**Consequences:** Highlighted essay text is hard to read in dark mode. For an educational tool, this is a usability failure.

**Prevention:**
1. Use low-opacity translucent highlights (`bg-blue-500/15`, `bg-emerald-500/20`) rather than solid pastel backgrounds. These work in both themes because the underlying text color is preserved.
2. Define highlight colors as CSS custom properties scoped to light and dark themes so they can be tuned independently.
3. Reuse the existing color hues from `CategoryFeedback.tsx` (emerald for strengths, amber for improvements) to maintain visual consistency between highlights and feedback cards.
4. Test all 4 category colors in both light and dark modes. Text on highlighted background must meet WCAG AA contrast (4.5:1).

**Detection:** Toggle dark mode and check if all highlighted text is legible.

**Phase:** Address when defining the highlight color system, before building the highlight rendering component.

---

### Pitfall 9: Zustand Store Grows Into a God Object

**What goes wrong:** Highlighting state (active category, hovered passage), hero collapse state, and auth form state all get added to the existing `app-store.ts`. The single store becomes a monolith that re-renders many components on unrelated state changes.

**Why it happens:** The app already has `app-store.ts` and `profile-store.ts`. Adding new fields to the existing store feels easier than creating new ones. Developers forget to use granular selectors and destructure the entire store in components.

**Consequences:** Typing in the essay textarea re-renders the highlight layer. Hovering a feedback category re-renders the essay input. Performance degrades with long essays.

**Prevention:**
1. Keep `app-store` for grading workflow state (essay text, rubric, results, history) -- it already does this well.
2. Create a new `highlight-store` for ephemeral highlighting UI state (active category index, hovered passage). This state should NOT be persisted.
3. Hero collapse state should be derived from existing state (see Pitfall 4), not stored.
4. Always use individual selectors: `useAppStore((s) => s.essayText)` not `const { essayText, currentResult, ... } = useAppStore()`.

**Detection:** React DevTools Profiler showing re-renders in components that should be idle during unrelated interactions.

**Phase:** Establish the store architecture at the start, before building new features.

## Minor Pitfalls

### Pitfall 10: Textarea vs. ContentEditable for Editable Essay in Results

**What goes wrong:** The results view needs to show the essay with inline highlights AND be editable for resubmit. A `<textarea>` cannot render inline highlights (plain text only). Developers reach for `contentEditable` divs, which introduce cursor management, paste handling, undo/redo, and HTML sanitization complexity.

**Why it happens:** The requirement combines two conflicting needs -- rich visual rendering (highlights) and text editing -- in the same element.

**Prevention:** Use a two-mode approach: render the essay in a read-only div with highlight spans by default, and toggle to a plain `<textarea>` when the user clicks "Edit." The textarea does not need highlights -- just the text. On re-submit, fresh results will have new highlights. Do NOT use `contentEditable`. Do NOT import TipTap, Slate, or ProseMirror for this.

**Detection:** If you are researching rich text editor libraries, you are overengineering this feature.

**Phase:** Design the edit/view toggle pattern during the side-by-side layout phase.

---

### Pitfall 11: Route Structure Conflicts When Merging Home and Grade Pages

**What goes wrong:** The current app has three routes: `/` (LandingPage), `/grade` (GradingPage), `/profile` (ProfilePage). The redesign merges Home and Grade into a single combined page. Developers create the new combined page but leave stale routes, navigation items, and click handlers pointing to the old structure.

**Why it happens:** The merge seems simple but the route table in `App.tsx`, the `navItems` array in `Header.tsx` (currently 3 items including "Home", "Grade", "Profile"), and the history click handler in `ProfilePage.tsx` (which calls `navigate("/grade")`) all reference the old structure.

**Consequences:** Dead links, duplicate pages, or navigating to a history entry lands on a blank or wrong page.

**Prevention:**
1. Plan the route migration explicitly: `/` becomes the combined home+grade page, `/grade` either redirects to `/` or is removed, `/profile` stays.
2. Update `navItems` in `Header.tsx` from 3 items to 2 (Home, Profile).
3. Update the `ProfilePage.tsx` history click handler which navigates to `/grade`.
4. Do the route change as a discrete, testable step before building new features on top.

**Detection:** Click every navigation link and every history entry after the merge. Check that no route shows a blank page.

**Phase:** This should be the very first change -- before building the collapsible hero or side-by-side layout.

---

### Pitfall 12: CSS Transition on Height: Auto Does Not Animate

**What goes wrong:** Developers try `transition: height 300ms` on the hero section, but CSS cannot transition from `height: auto` to `height: 0`. The hero snaps instantly instead of animating.

**Why it happens:** CSS transitions require explicit numeric start and end values. `auto` is not numeric.

**Prevention:** Use CSS grid with `grid-template-rows: 1fr` transitioning to `grid-template-rows: 0fr` with `overflow: hidden` on the child. This animates cleanly without needing to guess a max-height value. Alternatively, use `max-height` with a generous upper bound, though this produces timing inconsistencies when the actual content height varies.

**Detection:** If the hero pops open/closed instead of sliding, check whether you are transitioning `height: auto`.

**Phase:** Address during collapsible hero implementation.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Route restructuring (merge Home+Grade) | Stale routes and nav links (Pitfall 11) | Do route merge as an isolated first step; test all navigation paths |
| Mock API schema update | Missing passage reference fields in types (Pitfall 2) | Add `highlights: { start, end, categoryIndex }[]` to `GradingResult` before building UI |
| Mock API schema update | Overlapping passage ranges (Pitfall 3) | Enforce non-overlapping ranges in mock data |
| Collapsible hero section | CSS height:auto does not animate (Pitfall 12) | Use CSS grid-template-rows animation |
| Collapsible hero section | Hero state conflicts with navigation (Pitfall 4) | Derive collapse from essayText/currentResult state, not separate useState |
| Side-by-side layout | 960px container too narrow (Pitfall 1) | Break out of shared container; use wider max-width for results view |
| Side-by-side layout | Bad tablet stacking breakpoint (Pitfall 5) | Use `lg:` (1024px) not `md:` for the split |
| Text highlighting | Poor contrast in dark mode (Pitfall 8) | Use translucent highlight colors with CSS custom properties |
| Editable essay + highlights | contentEditable complexity (Pitfall 10) | Read-only highlight view + toggle to plain textarea for editing |
| Scroll linking between panes | Bidirectional scroll sync loop (Pitfall 6) | One-directional only: feedback click scrolls essay pane |
| Mock authentication | Auth gating blocks core grading (Pitfall 7) | Only gate Profile page settings; never gate grading routes |
| Store architecture | God object Zustand store (Pitfall 9) | Create dedicated highlight-store for ephemeral UI state |

## Sources

- Direct codebase analysis: `Layout.tsx` (960px max-width constraint), `GradingPage.tsx` (conditional render pattern causing re-mount), `app-store.ts` (current Zustand structure and persist config), `profile-store.ts` (existing `isSignedIn` state), `CategoryFeedback.tsx` (emerald/amber color scheme), `Header.tsx` (3-item navItems array), `App.tsx` (3-route structure), `ProfilePage.tsx` (history navigate to /grade), `api/types.ts` (CategoryScore lacks passage references)
- CSS grid-template-rows animation: well-supported in all modern browsers since 2023
- CSS height:auto transition limitation: fundamental browser behavior, not version-dependent
- WCAG 2.1 Level AA contrast requirements: 4.5:1 minimum for normal text
- Zustand selector patterns: standard guidance on avoiding unnecessary re-renders via granular selectors

---
*Pitfalls research for: AI Essay Grader v1.1 UX Redesign*
*Researched: 2026-03-08*
