# Pitfalls Research

**Domain:** Adding Tiptap editor + LanguageTool API + ProseMirror decorations to existing React essay grader
**Researched:** 2026-03-12
**Confidence:** HIGH (Tiptap/ProseMirror pitfalls verified via official docs + GitHub issues; LanguageTool rate limits verified via official API docs)

## Critical Pitfalls

### Pitfall 1: Zustand `essayText` Sync Breaks with Tiptap

**What goes wrong:**
The existing `EssayInput` component is a thin wrapper around `<Textarea>` with a controlled `value={essayText}` fed from Zustand. Replacing it with Tiptap's `useEditor` hook means the editor owns its own document state internally. You cannot use a controlled React pattern (value prop) with Tiptap. If you try to force `editor.setContent(essayText)` inside a `useEffect` watching `essayText`, you create a feedback loop: typing triggers `onUpdate` → updates Zustand → `useEffect` fires → `setContent` resets the cursor position. Every keystroke jumps the cursor to the end.

**Why it happens:**
Developers migrating from textarea assume Tiptap can be used as a controlled component. Tiptap's editor state lives inside ProseMirror, not React state. The editor IS the source of truth for content. Zustand should be a subscriber, not a controller.

**How to avoid:**
- Treat `essayText` in Zustand as write-only from the editor's perspective: use `onUpdate` to push text INTO the store, never use the store to push content back into the editor
- Populate initial content once via `useEditor({ content: initialText })` using the Zustand value at mount time. After that, the editor controls the content.
- When restoring a previously loaded essay (file upload or drag-drop), use `editor.commands.setContent(text)` from the upload handler directly, not through a Zustand watch
- For file upload/drop, imperatively call `editor.commands.setContent()` from the existing `handleFile` callback using a forwarded editor ref

**Warning signs:**
- Cursor jumps to end of text on every keypress
- Undo (Ctrl+Z) behaves erratically, restoring deleted text
- `console.log` in `onUpdate` and `useEffect` fire in alternating sequence

**Phase to address:**
Phase 1 (Tiptap Editor Setup) — the sync strategy must be established before any LanguageTool work begins. Getting this wrong cascades into every subsequent phase.

---

### Pitfall 2: LanguageTool API Response Positions Don't Map to ProseMirror Positions

**What goes wrong:**
LanguageTool returns match offsets as `offset` (character index in the submitted plain text) and `length`. ProseMirror positions are NOT the same as plain text character positions — ProseMirror counts node boundaries as positions. A document with a single paragraph wrapping "Hello world" has ProseMirror positions 0 (before doc), 1 (before paragraph), 2 (before "H"), 13 (after "d"), 14 (after paragraph), 15 (after doc). If you naively add a decoration at positions `offset` and `offset + length`, you decorate the wrong characters or throw a RangeError.

**Why it happens:**
Tiptap exposes `getText()` which returns the same plain text string you sent to LanguageTool, making it seem like character positions should be equivalent. The hidden complexity is the ProseMirror document tree. Each paragraph node adds 2 positions (open + close tags). Multi-paragraph essays shift all LanguageTool offsets further and further from their ProseMirror equivalents.

**How to avoid:**
- Use ProseMirror's `doc.resolve()` and `doc.content.findIndex()` to walk the document and map plain text character offsets to ProseMirror positions
- The correct approach: `editor.state.doc.content.nodesBetween(0, doc.content.size, ...)` to accumulate plain text character counts per node, then map LanguageTool offsets into that coordinate system
- Reference the `tiptap-languagetool` open-source extension (github.com/sereneinserenade/tiptap-languagetool) as a working reference implementation of this position mapping
- Write a unit test with a multi-paragraph essay: verify decoration start/end positions decode to the correct words

**Warning signs:**
- Decorations appear on the wrong words (off by 1-2 characters for single paragraph, worsening with each additional paragraph)
- `RangeError: Position X out of range` thrown by ProseMirror when applying decorations
- Decorations work correctly on single-paragraph essays but break on multi-paragraph ones

**Phase to address:**
Phase 2 (LanguageTool Integration) — implement and test position mapping before building the suggestion popover UI.

---

### Pitfall 3: Decoration Updates on Every Keystroke Cause Visible Lag

**What goes wrong:**
The naive implementation: `onUpdate` fires → debounce timer resets → API call fires after 3 seconds → decorations update. This seems fine. But the problem is that when the document changes between the API call being made and the response arriving, the old decoration positions are now stale (text was inserted or deleted at those positions). Applying stale decorations to the current document breaks position mapping. Additionally, if decorations are stored in React state and updated via `setState`, React re-renders the entire component tree containing the editor on every API response, causing visible flicker.

**Why it happens:**
Decorations must be applied as a ProseMirror plugin with its own state machine, not as React state fed back into the editor via props. React's rendering and ProseMirror's rendering are separate. Mixing them causes double-rendering artifacts. The LanguageTool community extension pattern uses a ProseMirror plugin (accessible via Tiptap's `addProseMirrorPlugins()` in a custom extension) specifically to avoid this.

**How to avoid:**
- Implement LanguageTool decorations as a **Tiptap extension** with `addProseMirrorPlugins()`. The plugin manages a `DecorationSet` in its own ProseMirror plugin state, not in React state.
- When the API response arrives, dispatch a custom transaction to the editor: `editor.view.dispatch(tr.setMeta(pluginKey, { matches: apiResponse }))`. The plugin then builds a fresh `DecorationSet` from the response.
- Use ProseMirror's `tr.mapping.map()` to remap decoration positions through any transactions that occurred between the API call and the response — this prevents stale position errors.
- Never store `DecorationSet` in React state or Zustand. It belongs entirely within the ProseMirror plugin state.

**Warning signs:**
- Editor flickers or loses focus when grammar results arrive
- Typing during an in-flight API call causes decorations to appear on wrong text
- `console.log` shows React component re-rendering on every API response

**Phase to address:**
Phase 2 (LanguageTool Integration) — architecture decision that cannot be retrofitted easily once the popover UI is built on top of it.

---

### Pitfall 4: LanguageTool Free API Rate Limit Exhaustion

**What goes wrong:**
The free LanguageTool API allows 20 requests per IP per minute and a maximum of 20KB of text per request. At a 3-second debounce, a fast typist who pauses briefly every few seconds generates a request approximately every 3 seconds — that is 20 requests per minute, hitting the cap under normal continuous use. The API returns HTTP 429 with no retry-after header. If the rate limit is hit, the error handling must suppress the error silently (not toast a red error at the user for a background check), and the next successful check must pick up fresh results.

**Why it happens:**
3 seconds sounds conservative, but the rate limit is per-IP for all users behind a NAT or corporate proxy. In a demo/class environment with many students on the same network, every student contributes to a shared 20 req/min cap. Even solo, a student writing actively will hit the cap if the debounce is not managed carefully.

**How to avoid:**
- Use 3-second debounce as a minimum, increasing to 5+ seconds when the previous request returned a 429
- Implement a simple backoff: on 429, skip the next 2 check windows (add a `skipUntil` timestamp in the extension state)
- Only send requests when text has actually changed (compare hash of last-checked text before firing)
- Cap text at 20KB before sending — `text.slice(0, 20000)` with a character warning to the user if truncation occurs
- On rate-limit errors, keep the last successful set of decorations rather than clearing them

**Warning signs:**
- Grammar underlines vanish during active typing sessions
- Network tab shows HTTP 429 responses
- Users report "feedback stopped working" after several minutes

**Phase to address:**
Phase 2 (LanguageTool Integration) — debounce and error handling must be built with the rate limit in mind from the start.

---

### Pitfall 5: Tiptap useEditor Stale Closure in onUpdate Callback

**What goes wrong:**
`useEditor({ onUpdate: () => { doSomething(someVar) } })` captures `someVar` in a closure at mount time. If `someVar` is a React state variable that changes (e.g., a "feedback enabled" toggle), the `onUpdate` callback always sees the stale value from when the editor was created. This is a documented Tiptap bug — the `useEditor` hook does not update callback options after mount by default.

In this project: the toolbar will have a "live feedback toggle" that enables/disables LanguageTool. If `onUpdate` captures the initial `feedbackEnabled = false` value, the toggle will appear to work but the underlying behavior never changes.

**Why it happens:**
The `useEditor` hook memoizes the editor instance. Callbacks passed as options are saved once, not updated with each re-render. This is a known limitation documented in Tiptap GitHub issues (#2403, #5831).

**How to avoid:**
- Use a `ref` for any values that `onUpdate` needs to access: `const feedbackEnabledRef = useRef(feedbackEnabled); useEffect(() => { feedbackEnabledRef.current = feedbackEnabled; }, [feedbackEnabled]);`
- Inside `onUpdate`, read from `feedbackEnabledRef.current` instead of the captured closure variable
- Alternatively, move the LanguageTool triggering logic into the Tiptap extension itself using ProseMirror's `appendTransaction` hook, which always has access to fresh extension storage/options

**Warning signs:**
- The live feedback toggle appears to work visually but decorations still appear/disappear incorrectly
- Console logging `feedbackEnabled` inside `onUpdate` always shows the initial value regardless of toggle state
- Behavior is correct immediately after page reload but breaks after toggling the setting

**Phase to address:**
Phase 1 (Tiptap Editor Setup) and Phase 3 (Toolbar + Toggle Feature) — establish the ref pattern for mutable options before building toggle-dependent logic.

---

### Pitfall 6: ProseMirror Decoration Cursor Jump on Async State Update

**What goes wrong:**
When a LanguageTool API response arrives and the extension dispatches a transaction to update decorations, if that transaction is dispatched outside of a browser event context (e.g., in a `setTimeout` or `fetch().then()` callback), ProseMirror can misplace the cursor — particularly if the user was typing at the end of a line at the moment the update was applied. This is a documented ProseMirror issue (github.com/ProseMirror/prosemirror/issues/942).

**Why it happens:**
ProseMirror reconciles the DOM's selection with its internal selection after each transaction. When a transaction arrives asynchronously while the browser's native text input processing is in flight (e.g., IME composition, autocorrect), the selection reconciliation can displace the cursor.

**How to avoid:**
- Use `requestAnimationFrame` to defer decoration transactions until after the current browser event loop tick completes: `requestAnimationFrame(() => { editor.view.dispatch(decorationTransaction) })`
- Mark the decoration transaction with `.setMeta('addToHistory', false)` to prevent it from appearing in undo history
- Test with IME input (macOS Chinese/Japanese input) and with Safari's spellcheck autocorrect enabled

**Warning signs:**
- Cursor jumps to a random position when grammar check results arrive
- Undo skips past legitimate typing history (decoration updates polluting history)
- Issue only appears when actively typing, not when testing with a pre-pasted essay

**Phase to address:**
Phase 2 (LanguageTool Integration) — test this during decoration implementation, not as a post-hoc fix.

---

### Pitfall 7: The Existing HighlightedEssay System Breaks After EssayText Contains HTML

**What goes wrong:**
`HighlightedEssay.tsx` uses `result.essayText` (a plain text string) for its segment-based highlighting. The `buildSegments()` utility in `highlight-utils` performs character-based substring extraction using `start`/`end` offsets from the grading API response. If `essayText` in the store is ever set to Tiptap's HTML output (from `editor.getHTML()`) instead of plain text (from `editor.getText()`), the character offsets in the grading response will not match the HTML string, and every highlight will appear at the wrong position or display raw HTML tags.

**Why it happens:**
When migrating to Tiptap, developers may call `editor.getHTML()` when syncing text to Zustand because it's the "save the document" instinct. The grading API receives HTML with `<p>` tags, scores against that, produces offsets against that string, and they appear to work — until the results view renders them against the plain text that `HighlightedEssay` expects.

**How to avoid:**
- Always use `editor.getText({ blockSeparator: '\n\n' })` when syncing to Zustand `essayText` and when submitting to the grading API
- The `essayText` in the store must remain a plain text contract — never contain markup
- Add a TypeScript comment on the `setEssayText` action noting: "Must be plain text — used for character-offset highlighting in results view"
- In the `onUpdate` callback: `const text = editor.getText({ blockSeparator: '\n\n' }); setEssayText(text);`

**Warning signs:**
- `HighlightedEssay` shows visible `<p>` or `</p>` substrings in the rendered essay text
- Highlights appear offset by a few characters in ways that correlate to HTML tag lengths
- Works correctly when essay has one paragraph, breaks with two or more paragraphs

**Phase to address:**
Phase 1 (Tiptap Editor Setup) — this is a data contract decision that must be locked in on the first day of migration.

---

### Pitfall 8: React 19 Compatibility — Tiptap UI Components Not Yet Fully Supported

**What goes wrong:**
This project uses React 19.2.0. Tiptap's core `@tiptap/react` package works with React 19, but Tiptap's UI component library (`@tiptap/ui-components`, pre-built toolbar and popover primitives) is officially documented as working best with React 18. Using Tiptap UI components in React 19 may cause warning floods or subtle rendering bugs. Custom-built popover/suggestion UIs using Radix (already in the project as shadcn/ui components) are safer.

**Why it happens:**
Tiptap's UI layer bundles its own Radix-based primitives that were built and tested against React 18. React 19's changes to how refs are handled and how transitions work can conflict with these assumptions.

**How to avoid:**
- Do NOT use `@tiptap/ui-components` or `@tiptap/suggestion` UI primitives. Build the suggestion popover using the existing `Popover` component from `src/components/ui/popover.tsx` (already in project, Radix-based, React 19 compatible)
- Stick to `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit` — these are the stable packages confirmed working with React 19
- When building the click-to-fix popover, position it based on the decoration's DOM element coordinates via `editor.view.domAtPos()` rather than relying on Tiptap's built-in suggestion extensions

**Warning signs:**
- React console warns about `ref` prop changes or `act()` requirements in tests
- Popover positioning is subtly broken in React 19 but not React 18
- Installing `@tiptap/extension-mention` or similar extensions brings in `@tiptap/suggestion` which may pull in incompatible UI packages

**Phase to address:**
Phase 1 (Tiptap Editor Setup) — decide on popover strategy before installing any Tiptap UI packages.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing decorations in React state (useState) instead of ProseMirror plugin state | Familiar React patterns, easier to debug | Editor flicker on every API response, cursor displacement, double-render | Never — use ProseMirror plugin state |
| Using `editor.getHTML()` for the Zustand `essayText` store | Preserves paragraph structure | Breaks `HighlightedEssay` character-offset system entirely | Never — always use `getText()` |
| Calling LanguageTool on every `onUpdate` without debounce | Immediate feedback | Hits 20 req/min rate limit in under a minute | Never |
| Skipping position mapping unit tests | Faster development | Off-by-N decoration bugs that are invisible on single-paragraph essays | Never — multi-paragraph essays are the common case |
| Using Tiptap UI components package in React 19 | Less custom code | Potential React 19 incompatibilities, extra bundle weight | Not until Tiptap officially supports React 19 |
| Setting `content` on useEditor from persisted Zustand state on every re-render | Keeps store "in sync" | Infinite cursor-reset loop | Never — set initial content once at mount only |
| Calling `editor.commands.setContent()` inside `useEffect` watching Zustand state | Seems reactive | Cursor jump on every keystroke | Never — imperative setContent only from event handlers |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tiptap + Zustand | Bidirectional sync via useEffect | One-way: editor → Zustand via `onUpdate`. Zustand → editor only at mount or from imperative handlers (file upload) |
| LanguageTool API | GET request | POST only to `https://api.languagetool.org/v2/check` with `Content-Type: application/x-www-form-urlencoded` |
| LanguageTool API | Sending JSON body | Use `URLSearchParams` to encode form body: `text=...&language=en-US` |
| LanguageTool API | Sending HTML content from editor.getHTML() | Send `editor.getText({ blockSeparator: '\n\n' })` — plain text only |
| ProseMirror decorations | Applying DecorationSet from React state | Use `addProseMirrorPlugins()` in a Tiptap extension; decorations live in plugin state, not React state |
| LanguageTool offsets | Treating LanguageTool character offsets as ProseMirror positions | Walk the doc with `nodesBetween` to build an offset-to-PM-position map |
| Tiptap + React 19 | Using @tiptap/ui-components | Build suggestion popover with existing Radix `Popover` from shadcn/ui |
| Suggestion popover positioning | Computing pixel position from LanguageTool offset alone | Use `editor.view.domAtPos(pmPos)` to get the DOM node, then `getBoundingClientRect()` for screen coordinates |
| EssayPanel edit mode | textarea still used for post-grading editing | The results view `EssayPanel` editing textarea can remain — only the pre-grading input gets Tiptap |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No debounce on LanguageTool API | Rate limit hit in under 60 seconds of active typing | 3-second debounce minimum; cancel previous pending request on new keypress | Immediately without debounce |
| DecorationSet rebuilt on every editor transaction | Editor feels sluggish; 100ms+ input latency | Only rebuild `DecorationSet` when LanguageTool meta is present in the transaction, not on every transaction | Essays > 500 words with many matches |
| Running heuristics on every `onUpdate` | Noticeable lag on each keypress | Debounce heuristics separately (1 second); most heuristics are O(n) on word count | Essays > 2000 words |
| `editor.getText()` called on every render | Repeated full document serialization | Call `getText()` only in `onUpdate` callback, cache result | Not a real bottleneck at essay scale, but is sloppy |
| Many overlapping decorations | Slow ProseMirror redraws | LanguageTool typically returns 5-30 matches per essay check; this is not a problem at essay scale | Thousands of decorations (not applicable here) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sending essay text to LanguageTool public API | User essay content transmitted to third-party server | Add visible disclosure in UI: "Grammar checking uses LanguageTool's service. Your text is sent to their servers." Required by their terms of use. |
| Missing `rel` attribution for LanguageTool | TOS violation — LanguageTool requires visible attribution link without `rel="nofollow"` | Add "Powered by LanguageTool" link in the editor area or footer when grammar check is active |
| Sending HTML with user content to LanguageTool | XSS via crafted text is not a risk here (plain text sent), but HTML leak could expose markup | Always send `editor.getText()`, never `getHTML()` — plain text only to external API |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Red underline appears on partial words as user types | Distracting, feels broken | Debounce ensures underlines only appear after typing pause; clear all decorations immediately when typing resumes using a `compositionstart` handler |
| Grammar popover stays open when user clicks elsewhere | Blocks typing, confusing | Close popover on any editor click outside the marked text; close on `Escape` key |
| Live feedback indistinguishable from grading highlights | User confused about which highlights are grammar vs. rubric feedback | Use different visual style: LanguageTool = wavy underline (`text-decoration: wavy underline`); grading highlights = background color (existing system) |
| "Feedback off" toggle state not visible | User types, wonders why nothing is checking | Show indicator in toolbar: toggle must have clear on/off visual state with label, not just an icon |
| 3-second delay before first feedback | User types first sentence, nothing happens for 3 seconds | Show a subtle "checking..." indicator in the toolbar during the debounce window |
| Grammar errors from LanguageTool shown after user fixes them | Stale underlines linger | Ensure each successful API response fully replaces the previous DecorationSet |
| Suggestion popover covers the text being corrected | User cannot see context | Flip popover above/below based on viewport position (Floating UI / Radix handles this automatically) |

## "Looks Done But Isn't" Checklist

- [ ] **Tiptap → Zustand sync:** `editor.getText({ blockSeparator: '\n\n' })` is what gets stored and submitted. Verified: paste an essay with 3+ paragraphs, submit for grading, confirm `HighlightedEssay` highlights appear on correct words
- [ ] **File upload works with Tiptap:** Drag-dropping a .txt file or selecting via file input sets editor content AND Zustand `essayText`. Verified: `editor.getText()` equals the file content after drop
- [ ] **Debounce cancellation:** Rapid typing produces exactly one API request per typing pause, not one per keystroke. Verify in Network tab.
- [ ] **Rate limit handling:** Simulate 429 by temporarily pointing at a fake endpoint that returns 429. Verify no toast error shown to user, existing decorations retained.
- [ ] **Multi-paragraph position mapping:** Check 3 specific LanguageTool match offsets against their ProseMirror positions in a 3-paragraph essay. Decorations must highlight the correct word.
- [ ] **Cursor stability:** Type continuously while a grammar check is in flight. Cursor must not jump when API response arrives.
- [ ] **Toggle works with stale closure fix:** Enable editor, toggle feedback off, type, toggle back on — confirm live feedback activates/deactivates correctly.
- [ ] **Post-grading view unaffected:** Submit an essay for grading, confirm `HighlightedEssay` in results still renders correctly. The Tiptap migration must not break the existing highlight system.
- [ ] **EssayPanel edit mode still works:** In results view, click edit, modify essay text in the existing `<textarea>`, click re-grade. Tiptap editor is NOT in the results view; that textarea stays.
- [ ] **LanguageTool attribution:** A visible "Powered by LanguageTool" link (no nofollow) is present when grammar checking is enabled.
- [ ] **Word count still works:** `WordStats` component receives accurate word count from Tiptap editor. The existing `essayText` Zustand store is the source; verify it stays plain text.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bidirectional Zustand sync cursor bug | MEDIUM | Remove the `useEffect` watching `essayText`, convert file upload to imperative `editor.commands.setContent()`. One-time refactor of EssayInput. |
| Wrong position mapping (decorations on wrong words) | MEDIUM | Rewrite position mapper function; unit test confirms fix. Does not affect API integration code. |
| Decorations in React state (flicker) | HIGH | Must restructure as Tiptap extension with ProseMirror plugin state. Requires rewrite of LanguageTool integration layer. |
| Rate limit without backoff | LOW | Add `skipUntil` ref to debounce logic. 30-minute fix once identified. |
| HTML stored in essayText | HIGH | Causes silent corruption of all grading results. Requires fixing getText() extraction AND clearing all persisted Zustand state in localStorage. |
| Tiptap UI component React 19 conflicts | MEDIUM | Uninstall `@tiptap/ui-components`, rebuild popovers using project's existing Radix primitives. |
| Stale closure on feedback toggle | LOW | Add `useRef` pattern for toggle state. 15-minute fix. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Zustand ↔ Tiptap bidirectional sync | Phase 1: Tiptap Editor Setup | Typing does not move cursor; file upload sets content correctly |
| HTML vs. plain text in essayText | Phase 1: Tiptap Editor Setup | `typeof essayText` logged after paste — must be plain text with no angle brackets |
| Stale closure on onUpdate callback | Phase 1: Tiptap Editor Setup | Toggle feedback off, type 10 words, toggle on — API fires correctly |
| React 19 Tiptap UI compatibility | Phase 1: Tiptap Editor Setup | No React 19 warnings in console; popover built with shadcn/ui Popover |
| LanguageTool offset → ProseMirror position | Phase 2: LanguageTool Integration | Unit test: 3-paragraph essay, verify 5 matches render on correct words |
| Decorations in React state (flicker) | Phase 2: LanguageTool Integration | Editor does not flicker on API response; cursor stable during typing |
| Async decoration cursor jump | Phase 2: LanguageTool Integration | Type continuously through an API response arrival — cursor stays in place |
| Rate limit exhaustion | Phase 2: LanguageTool Integration | Simulate rapid editing — no error toasts; graceful degradation |
| Stale decorations after fix applied | Phase 3: Suggestion Popover | Accept a fix, confirm underline disappears; next check shows fresh results |
| Post-grading HighlightedEssay unaffected | Phase 1 + Phase 2 verification | Submit graded essay — existing color highlights render correctly |

## Sources

- [Tiptap Integration Performance Guide](https://tiptap.dev/docs/guides/performance) — re-render isolation, `shouldRerenderOnTransaction`, `useEditorState`
- [Tiptap React Installation Docs](https://tiptap.dev/docs/editor/getting-started/install/react) — `immediatelyRender`, React 19 status
- [Tiptap Liveblocks Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips) — `content` vs `initialContent`, schema validation
- [LanguageTool Public HTTP API Docs](https://dev.languagetool.org/public-http-api.html) — rate limits (20 req/min, 20KB/request), POST requirement, attribution requirement
- [ProseMirror DecorationSet in React — Faisal Mujtaba, Medium](https://medium.com/@faisalmujtaba/prosemirror-decorationset-in-react-everything-i-wish-someone-had-told-me-6262eabae7ca) — external API decoration patterns
- [ProseMirror Issue #942 — Cursor jump on decoration update from setInterval/API response](https://github.com/ProseMirror/prosemirror/issues/942)
- [Tiptap Issue #2403 — onUpdate callback not updated after re-render (stale closure)](https://github.com/ueberdosis/tiptap/issues/2403)
- [Tiptap Issue #5831 — useEditor does not react when option value changes](https://github.com/ueberdosis/tiptap/issues/5831)
- [Tiptap Discussion #3496 — Working with React state management](https://github.com/ueberdosis/tiptap/discussions/3496)
- [tiptap-languagetool reference implementation](https://github.com/sereneinserenade/tiptap-languagetool) — position mapping, decoration extension pattern
- [Tiptap Issue #5856 — SSR / immediatelyRender hydration mismatch](https://github.com/ueberdosis/tiptap/issues/5856)
- Direct codebase analysis: `src/components/grading/EssayInput.tsx` (current textarea + Zustand pattern), `src/components/results/HighlightedEssay.tsx` (character-offset highlight system), `src/lib/highlight-context.tsx` (existing highlight state), `src/stores/app-store.ts` (essayText in Zustand persist), `src/pages/GradingPage.tsx` (submission flow), `src/components/results/EssayPanel.tsx` (post-grading edit textarea)

---
*Pitfalls research for: AI Essay Grader v2.2 Live Essay Feedback (Tiptap + LanguageTool)*
*Researched: 2026-03-12*
