# Feature Landscape

**Domain:** AI essay grading tool -- v1.1 UX redesign (side-by-side layout, highlighting, collapsible hero, mock auth)
**Researched:** 2026-03-08
**Confidence:** MEDIUM (web research verified against Turnitin official docs, Grammarly engineering blog, QuillBot product pages)

## Context

v1.0 is built and working: essay input, rubric upload, submission flow, score bars, feedback sections, history, profile with grade level. This research covers the NEW features for v1.1 -- how they work in comparable tools, what's table stakes vs differentiating, and implementation considerations.

---

## Table Stakes

Features users expect once a tool claims to show "feedback in context." Missing any of these makes the v1.1 redesign feel half-done.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Side-by-side essay + feedback layout | Every serious writing feedback tool (Grammarly editor, Turnitin Feedback Studio, GPTZero reviewer) places source text next to results. Users need to cross-reference feedback with their writing without scrolling between sections. This is THE defining UX pattern for writing feedback tools. | Medium | Core layout change -- transforms the entire GradingPage. Turnitin uses essay on left, insight panel on right. Grammarly uses text on left, suggestions sidebar on right. Use a fixed split ratio (not resizable). |
| Color-coded text highlighting linked to feedback categories | Turnitin's multicolor highlighting maps colors to match sources/categories; clicking the filter icon toggles them. The Highlight Tool for Google Docs assigns colors per category (yellow = dangling modifiers, red = run-ons). Users expect to SEE where feedback applies in the actual text, not just read about it abstractly. | Medium-High | Requires mock API to return passage references (start/end character positions or exact text snippets). Always-on highlighting (no hover required) is the right call -- matches Turnitin's default multicolor view. Colors should correlate with the rubric category color-coding already used in score bars. |
| Collapsible hero on input focus | QuillBot, Grammarly, and AI checker tools use a "get out of the way" pattern: branding/marketing content recedes once the user starts working. Google Search does this (logo shrinks after first query). Once a user focuses on the textarea, the tool area should dominate the viewport. | Low | CSS transition + state toggle on textarea focus. Standard progressive disclosure. The hero should contain the app title, brief description, and visually collapse (not disappear) to a minimal bar. |
| Mock sign-in screen on profile | Any tool with a profile page needs a sign-in gate. Without it, the profile settings feel disconnected -- why does user config exist if there's no user identity? Standard pattern: email + password form, centered card layout, clean typography. | Low | Mock-only: validate email format and password length, store fake session in Zustand + localStorage. Simulate 300-500ms delay for realism. No real auth backend. |
| Two-tab navigation (Home / Profile) | With home + grading merged into one page, a 3-tab nav is confusing (what would the third tab even be?). Two tabs cleanly maps to the app's actual page structure. | Low | Simple route restructure. Already planned. |
| Scroll synchronization between essay panel and feedback | When the essay is long, users expect clicking a feedback item to scroll the essay to the relevant highlighted passage. Turnitin does this -- clicking a numbered match scrolls to its source in the document. Without this, highlighting on long essays is nearly useless because users can't find the relevant passage. | Medium | Not explicitly in PROJECT.md scope but strongly expected once side-by-side + highlighting exist. Use scrollIntoView with smooth behavior and a brief highlight pulse on the target passage. |

## Differentiators

Features that elevate the app beyond typical AI essay graders. Not expected, but create a noticeably better experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Editable essay with inline resubmit | Most grading tools are submit-once, read-results. Letting users edit the essay IN the results view and resubmit without navigating away is a QuillBot-style interactive workflow. CoGrader and EssayGrader.ai are upload-and-wait; this feels live. | Medium | Requires maintaining essay state in the left panel of the split view, re-triggering the grading API on resubmit, clearing old highlights, and rendering new ones. Key state management challenge: what happens to the right panel during re-grading (loading skeleton vs stale results). |
| Category-color legend with toggle visibility | Turnitin lets users toggle multicolor highlighting per source via a filter icon. A small legend mapping colors to rubric categories (with on/off toggles) lets users focus on one feedback dimension at a time -- e.g., "show me only the Organization highlights." | Low | Small UI addition layered on top of the highlighting system. Adds meaningful control without complexity. Place it as a floating legend or at the top of the essay panel. |
| Smooth hero collapse animation | Most tools just hide content abruptly. A polished animation (hero compresses vertically, title fades to a compact bar, input area expands upward) creates a premium feel. Grammarly and QuillBot both have smooth transitions in their editor chrome. | Low | Pure CSS transitions or Framer Motion. Small effort, disproportionate polish impact. Use max-height transition or transform: scaleY with opacity fade. |
| Feedback-to-highlight hover linkage | Hovering over a feedback card in the right panel intensifies (or pulses) the corresponding highlight in the essay panel, and vice versa. Creates a visual connection between abstract feedback and concrete text. Grammarly does this with its inline underlines + sidebar suggestions. | Low-Medium | Shared hover state in Zustand or React context. Each feedback card and highlight group shares a category ID. On hover, add a CSS class to the paired elements. |
| Highlight intensity for severity | Rather than binary highlight/no-highlight, vary opacity or border weight to indicate feedback severity (minor suggestion vs critical issue). Adds information density without clutter. | Low-Medium | Depends on mock API data shape including a severity field. Stretch goal -- only if highlighting base is solid. |

## Anti-Features

Features to explicitly NOT build for v1.1. Tempting but wrong.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real OAuth / social login (Google, GitHub) | Massive complexity for a demo app. OAuth redirect flows, token refresh, provider setup -- none serves the grading UX. PROJECT.md explicitly excludes this. | Mock email+password form that validates format, stores a fake user object in Zustand. Simulate async delay. |
| Resizable / draggable split panes | Libraries like react-resizable-panels or allotment add dependency weight, accessibility concerns, and interaction complexity. Users of a grading tool need to READ, not fiddle with panel sizes. VS Code needs resizable panes; a grading tool does not. | Fixed 50/50 or 55/45 CSS grid split. On tablet (<1024px), stack vertically with essay on top, feedback below. |
| Rich text editing (bold, italic, toolbar) | Essay grading evaluates plain text content, not formatting. Adding Tiptap, Slate, or ProseMirror introduces enormous dependency and complexity for zero grading value. Turnitin and all essay graders accept plain text. | Plain textarea or simple contenteditable div. The "editable" in "editable essay" means text content editing, not document formatting. |
| Character-level annotation (inline comments) | Turnitin supports this, but it requires a sophisticated text annotation engine, selection handling, and popover positioning. Way too complex for a mock-data frontend. | Passage-level highlighting (entire sentences or phrases) with feedback cards in the side panel. Achieves 80% of the UX value at 20% of the implementation cost. |
| Plagiarism / AI detection scoring | Different product domain from essay grading. Turnitin keeps these as distinct tools. Mixing them confuses the UX and doubles mock data requirements. PROJECT.md excludes this. | Keep scope to rubric-aligned grading and feedback only. |
| PDF export of results | PROJECT.md marks this as out of scope. Proper PDF generation (html2canvas, jsPDF, or server-side) is disproportionate to demo value. | At most, a disabled "Export PDF" button as a placeholder signaling future capability. |
| Mobile-first responsive layout | Side-by-side layout fundamentally doesn't work on phone screens (<768px). Trying to make it responsive to 375px would compromise the core desktop/tablet experience. PROJECT.md sets tablet as the minimum. | Design for >= 768px width. Below that, show a graceful degradation message or auto-stack panels vertically. |

## Feature Dependencies

```
Combined home/grade page (route merge)
    |
    +---> Collapsible hero section (hero must exist on this combined page)
    |
    +---> Two-tab navigation (reduces routes from 3 to 2)
    |
    +---> Side-by-side results layout (restructures where results render)
              |
              +---> Text highlighting (highlights render in the essay panel of the split view)
              |         |
              |         +---> Scroll sync (needs highlight anchors to scroll to)
              |         |
              |         +---> Category toggle legend (layers on top of highlighting)
              |         |
              |         +---> Feedback-to-highlight hover linkage (needs both panels)
              |
              +---> Editable essay + resubmit (edit happens in left panel, triggers re-grade)

Mock API passage references
    |
    +---> Text highlighting (API must return highlight data: category, start, end, text)

Mock authentication (INDEPENDENT -- no dependencies on layout features)
    |
    +---> Profile page gate (already exists, just needs conditional rendering)
```

**Critical path:** Combined page --> Side-by-side layout --> Text highlighting --> Scroll sync

**Independent tracks:** Mock auth and two-tab nav can be built in parallel with the layout work.

**Mock API dependency:** Text highlighting requires updating the mock grading API response to include passage references. This should be designed FIRST so the highlighting UI has data to work with. Suggested shape:

```typescript
interface PassageHighlight {
  categoryId: string;       // maps to rubric category
  text: string;             // exact text to highlight
  startIndex: number;       // character offset in essay
  endIndex: number;         // character offset in essay
  feedbackType: 'strength' | 'improvement';
}
```

## MVP Recommendation

**Prioritize (must ship for v1.1 to feel like a real redesign):**

1. **Combined home/grade page with collapsible hero** -- Foundation for everything else. Low complexity, high structural impact. The hero collapse IS the first visible change of the redesign.
2. **Side-by-side results layout (fixed split)** -- Table stakes for any tool showing feedback on text. Without this, the app still feels like v1.0 with cosmetic changes. Use CSS grid, no resize library.
3. **Color-coded essay highlighting linked to rubric categories** -- The feature that makes feedback contextual rather than abstract. Turnitin proved this is what users expect. Requires mock API update to include passage references.
4. **Mock authentication on profile** -- Low effort, makes the profile page feel intentional. Simple email/password form with format validation and fake session.
5. **Two-tab navigation** -- Trivial but necessary cleanup once home/grade are merged.

**Stretch (build if time allows, in priority order):**

- **Scroll synchronization** -- Medium complexity but transforms the highlighting from "nice" to "actually useful" on longer essays. Click feedback card --> essay scrolls to highlighted passage.
- **Editable essay with resubmit** -- Medium complexity, careful state management needed. High value but not blocking for demo.
- **Feedback-to-highlight hover linkage** -- Low effort polish that connects the two panels visually.
- **Category toggle legend** -- Nice-to-have layered on highlighting.

## Complexity Budget

| Feature | Estimated Effort | Risk Level | Notes |
|---------|-----------------|------------|-------|
| Combined page + collapsible hero | 1-2 days | Low | CSS transitions, route merge, state toggle on focus |
| Two-tab navigation | 0.5 day | Low | Route config change, header update |
| Mock auth (profile gate) | 1 day | Low | Form validation, Zustand session, localStorage |
| Side-by-side layout | 2-3 days | Medium | Restructures GradingPage entirely, responsive breakpoints, existing component relocation |
| Mock API passage data | 0.5-1 day | Low | Update mock response type and data to include highlights |
| Text highlighting | 2-3 days | Medium-High | Text matching/splitting, color system, rendering highlighted spans, handling overlaps |
| Scroll synchronization | 1-2 days | Medium | Anchor refs, scrollIntoView, smooth behavior, edge cases |
| Editable essay + resubmit | 2-3 days | Medium | State management, loading states in split view, highlight refresh |
| Hover linkage | 0.5-1 day | Low | Shared hover state, CSS class toggling |

**Total: ~12-16 days full scope, ~7-9 days for MVP (first 5 items).**

## Sources

- [Turnitin multicolor highlighting -- official guide](https://guides.turnitin.com/hc/en-us/articles/23754255595149-Using-multicolor-highlighting-in-the-classic-Similarity-Report-view) -- MEDIUM confidence, official docs
- [Turnitin Feedback Studio next generation](https://www.turnitin.com/blog/unlocking-insights-whats-new-in-turnitin-feedback-studio) -- MEDIUM confidence, official blog
- [Grammarly real-time feedback UX](https://www.grammarly.com/blog/product/grammarly-feedback/) -- MEDIUM confidence, official product blog
- [Grammarly text input lag engineering](https://www.grammarly.com/blog/engineering/reducing-text-input-lag/) -- HIGH confidence, engineering blog with implementation details on highlight rendering performance
- [The Highlight Tool for Google Docs -- color-coded feedback pattern](https://edtechteacher.org/the-highlight-tool-google-doc-add-on-for-writing-and-feedback/) -- MEDIUM confidence, describes the color-to-category mapping UX
- [QuillBot AI Detector -- product overview](https://quillbot.com/blog/quillbot-tools/ai-detector/) -- MEDIUM confidence, official blog
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) -- HIGH confidence, referenced to justify NOT using a resize library
- [Hero section UX best practices -- LogRocket](https://blog.logrocket.com/ux-design/hero-section-examples-best-practices/) -- MEDIUM confidence, design patterns reference
- [GPTZero AI reviewer](https://gptzero.me/ai-reviewer) -- LOW confidence, competitor reference for side-by-side feedback layout
- [Turnitin Clarity side panel pattern](https://guides.turnitin.com/hc/en-us/articles/36917529868429-AI-Tools-with-Turnitin-Clarity) -- MEDIUM confidence, official guide showing panel-based feedback

---
*Feature research for: AI Essay Grader v1.1 UX Redesign*
*Researched: 2026-03-08*
