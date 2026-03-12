# Project Research Summary

**Project:** AI Essay Grader v2.2 — Live Essay Feedback
**Domain:** Rich text editor with inline grammar/spelling decorations + structural essay heuristics
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This milestone replaces the plain `<textarea>` in the existing AI Essay Grader with a Tiptap-based rich editor that gives students live grammar/spelling feedback as they write, before they submit for LLM grading. The research is clear on approach: use Tiptap v3 (ProseMirror-based, headless) configured as a plain-text-only editor, integrate LanguageTool's free public API via a debounced ProseMirror plugin for inline underlines, and layer client-side structural heuristics (thesis, paragraph structure, evidence, conclusion) as banners below the editor. The existing grading pipeline, results view, and Zustand store are untouched — the migration is surgical, swapping one input component for another while preserving the `essayText` plain-text contract.

The recommended stack adds five npm packages to the existing React 19 + Vite + TypeScript + Tailwind v4 + Zustand project: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, and `use-debounce`. All are confirmed compatible with React 19 with one required config flag (`immediatelyRender: false`). Tiptap Pro extensions and `@tiptap/ui-components` must be avoided — they carry React 19 incompatibilities. The suggestion popover should be built using the project's existing shadcn/ui `Popover` component, which is already Radix-based and React 19 compatible.

The dominant implementation risk is the Tiptap-to-Zustand sync pattern. Developers migrating from a controlled `<textarea>` instinctively try bidirectional sync, which causes cursor-jump bugs on every keystroke. The correct pattern is one-directional: editor pushes plain text to Zustand via `onUpdate`; Zustand never pushes content back into the editor after mount. A second hard problem is ProseMirror position offset mismatch: LanguageTool returns character offsets in plain text, but ProseMirror counts node boundaries — naively applying LT offsets as ProseMirror positions will decorate the wrong words in any multi-paragraph essay. Both risks are well-documented with clear prevention strategies established in this research.

---

## Key Findings

### Recommended Stack

The project already has React 19, Vite 7, TypeScript, Tailwind v4, Zustand, and shadcn/ui — no new infrastructure is needed. The v2.2 additions are minimal and deliberate: Tiptap v3 for the editor layer (the only React-native ProseMirror wrapper with a clean extension API), `use-debounce` for rate-limit-safe API scheduling, and the LanguageTool public API called directly from the browser (CORS wildcard confirmed via direct curl test). All other features — popovers, state management, word count — are implemented using existing dependencies.

**Core new technologies:**
- `@tiptap/react ^3.20.1` — React bindings and `useEditor` hook; headless, no bundled UI conflicts; requires `immediatelyRender: false` with React 19
- `@tiptap/pm ^3.20.1` — ProseMirror internals (Plugin, PluginKey, Decoration, DecorationSet); must match Tiptap minor version exactly; import always from this package, never from `prosemirror-*` directly
- `@tiptap/starter-kit ^3.20.1` — document schema; must disable all formatting marks (bold, italic, strike, headings, lists) for plain-text mode
- `@tiptap/extension-placeholder ^3.20.0` — CSS-based placeholder that does not interfere with content
- `use-debounce ^10.1.0` — React-native debounce hook for LanguageTool API rate-limit safety

**Critical version constraint:** All `@tiptap/*` packages must be pinned to the same minor version (3.20.x). Mismatched versions cause silent plugin registration failures.

**What NOT to add:** `@tiptap/ui-components` (React 18 only), any Tiptap Pro extension (tippyjs-react archived without React 19 support), direct `prosemirror-*` installs (creates duplicate module instances breaking decoration reconciliation).

### Expected Features

The v2.2 scope is fully specified in PROJECT.md and validated by research. All features are achievable with the stack above. See `.planning/research/FEATURES.md` for the full feature breakdown.

**Must have (table stakes — v2.2 launch):**
- Tiptap editor replacing textarea — foundation dependency for all other features
- Inline grammar/spelling underlines via LanguageTool API — the primary milestone value prop
- Click-to-fix suggestion popover — users cannot act on errors without this
- 3-second debounced API calls — required to stay within LanguageTool free tier (20 req/min)
- Toggle to enable/disable live feedback — distraction-free mode; missing this alienates anxious writers
- Word count display — must not regress from existing textarea behavior
- Writing timer (replaces History toolbar button) — explicitly specified in PROJECT.md
- Structural heuristic banners: thesis detection, paragraph count/balance, evidence signals, conclusion detection — client-side, no API call, directly aligned with rubric criteria

**Defer to v2.x after validation:**
- Error count badge — add once underline/popover flow is solid
- Heuristic signal phrase tuning — requires real student essay data to calibrate false positives

**Explicitly out of scope (v3+):**
- LLM-powered inline suggestions — deferred per PROJECT.md
- Grade-level calibrated LanguageTool rules — LanguageTool Premium, not available on free tier
- Custom ignore list / personal dictionary — disproportionate complexity per PROJECT.md

**Anti-features to avoid:** Auto-correct (academically dishonest in essay context), rich text formatting (breaks the plain-text grading pipeline), Pomodoro timer, real-time word-count progress bar.

### Architecture Approach

The migration is a surgical component swap. `EssayInput.tsx` is replaced by `TiptapEssayEditor.tsx`. `GradingToolbar.tsx` gains a `WritingTimer` component. `HeuristicFeedbackBanner.tsx` renders below the editor. The results view (`HighlightedEssay`, `EssayPanel`, `FeedbackPanel`) is completely untouched — Tiptap only appears in the pre-submission input view. The `essayText: string` field in `app-store.ts` (Zustand persist) remains the single source of truth for submission, written by the editor via `onUpdate` using `editor.getText({ blockSeparator: '\n\n' })`.

LanguageTool integration lives in a dedicated `src/extensions/language-tool/` folder containing a Tiptap Extension, a ProseMirror Plugin (which owns the `LTMatch[]` state and the `DecorationSet`), and a decoration builder that handles the critical character-offset-to-ProseMirror-position mapping. The API call is isolated in `src/api/languagetool.ts` behind an environment-variable-switchable endpoint, allowing fallback to a FastAPI proxy if direct browser CORS fails.

**Major components:**
1. `TiptapEssayEditor.tsx` — replaces textarea; owns Tiptap instance; syncs plain text to Zustand one-way; preserves `forwardRef` interface for file upload
2. `LanguageToolExtension` + `LanguageToolPlugin` — Tiptap extension wrapping a ProseMirror plugin; debounces API calls; dispatches decoration transactions via `tr.setMeta()`; owns `LTMatch[]` and `DecorationSet` in plugin state (never React state)
3. `SuggestionPopover.tsx` — click-to-fix UI built with existing shadcn/ui `Popover`; positioned via `editor.view.domAtPos()` + `getBoundingClientRect()`
4. `HeuristicFeedbackBanner.tsx` + `useEssayHeuristics` hook — pure computation on plain text string via `useMemo`; renders as dismissible info banners (not inline underlines, which are reserved for LanguageTool)
5. `WritingTimer.tsx` — self-contained session timer using `useRef` for interval and `useState` for elapsed seconds; no Zustand dependency

**Data flow (live feedback):** User types → `onUpdate` fires → Zustand sync (`editor.getText()`) + debounce reset → 3s pause → LanguageTool POST → `LTMatch[]` → `tr.setMeta(ltPluginKey, matches)` → plugin `apply()` → `DecorationSet` rebuilt → ProseMirror renders wavy underlines via CSS classes on decorated ranges.

### Critical Pitfalls

1. **Bidirectional Tiptap-Zustand sync causes cursor jump** — Using `useEffect` to push `essayText` back into the editor after mount creates an infinite update loop and resets the cursor on every keystroke. Prevention: one-way sync only — editor pushes to Zustand via `onUpdate`; Zustand never pushes back. File upload uses imperative `editor.commands.setContent()` directly from the event handler.

2. **LanguageTool character offsets do not equal ProseMirror positions** — ProseMirror counts node boundaries (each paragraph node adds 2 positions). Naively applying LT offsets causes decorations on the wrong words in multi-paragraph essays. Prevention: walk the document with `doc.nodesBetween()` to build a character-offset-to-PM-position map before creating decorations; validate with a unit test covering a 3+ paragraph essay.

3. **DecorationSet in React state causes flicker and cursor displacement** — Storing matches or decorations in `useState`/Zustand and feeding them back into the editor via props causes visible flicker and cursor displacement on every API response. Prevention: decorations must live exclusively in ProseMirror plugin state via `addProseMirrorPlugins()`. This architectural decision cannot be cheaply retrofitted once the popover is built on top of it.

4. **LanguageTool rate limit exhaustion** — 3-second debounce exactly hits the 20 req/min free tier cap under sustained active typing. In shared-IP environments (classroom/demo), multiple students compound the problem. Prevention: implement 429 backoff (`skipUntil` timestamp in extension state), hash-compare last-checked text before firing, keep stale decorations on rate-limit errors.

5. **Stale closure in `useEditor` `onUpdate` callback** — `useEditor` memoizes its options at mount time (documented Tiptap issues #2403 and #5831). The feedback toggle's current value is never visible inside `onUpdate`. Prevention: mirror the toggle value in a `useRef`, read from `ref.current` inside `onUpdate`. Must be established in Phase 1 before any toggle-dependent logic is built.

---

## Implications for Roadmap

Based on the dependency chain identified in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, a 7-phase build order is recommended. Each phase has a hard dependency on its predecessor (with exceptions noted).

### Phase 1: Foundation — Types, API Layer, and Plain-Text Editor

**Rationale:** The `essayText` plain-text contract and the Tiptap-Zustand sync pattern are the load-bearing decisions of the entire milestone. Getting these wrong cascades into every subsequent phase. Establish the data contract and one-way sync before any LanguageTool or UI work begins. The stale-closure ref pattern must also be established here so that all subsequent phases can depend on it.

**Delivers:** `src/lib/languagetool-types.ts`, `src/api/languagetool.ts`, `TiptapEssayEditor.tsx` (Tiptap only — no LanguageTool yet), `EssayInput.tsx` deleted, forwardRef interface preserved, existing grading submission flow verified unbroken.

**Addresses:** Table stakes — Tiptap editor replacing textarea, word count display, preserve existing essay text on mount.

**Avoids:** Bidirectional Zustand sync cursor bug (Pitfall 1), HTML stored in essayText (Pitfall 7 from PITFALLS.md — always use `getText()`, never `getHTML()`), React 19 Tiptap UI compatibility (Pitfall 8 — shadcn/ui Popover decided here), stale closure on `onUpdate` (Pitfall 5 — ref pattern established here).

**Research flag:** Standard patterns — well-documented Tiptap installation and controlled-to-uncontrolled component migration.

### Phase 2: LanguageTool Integration — Plugin, Decorations, Debounce

**Rationale:** The ProseMirror decoration layer is the most architecturally complex piece and must be built before any UI (popover) depends on it. Position mapping must be validated with multi-paragraph essays before the popover is built on top.

**Delivers:** `LanguageToolExtension.ts`, `LanguageToolPlugin.ts`, `decoration-builder.ts`, wavy underline CSS in `globals.css`, debounce + rate-limit handling, 429 backoff with `skipUntil`, cursor stability via `requestAnimationFrame`, unit tests for position mapping.

**Addresses:** Inline grammar/spelling underlines, 3-second debounce.

**Uses:** `@tiptap/pm` Plugin/PluginKey/Decoration/DecorationSet APIs; `use-debounce`; `src/api/languagetool.ts`.

**Avoids:** Decorations in React state (Pitfall 3), LT offset vs PM position mismatch (Pitfall 2), rate limit exhaustion (Pitfall 4), async cursor jump (Pitfall 6).

**Research flag:** Highest implementation risk. Validate position mapping with a unit test before proceeding to Phase 3. Verify LanguageTool CORS in the browser early — have the FastAPI proxy plan ready to activate if needed.

### Phase 3: Suggestion Popover

**Rationale:** The popover depends on decorated spans being clickable and the `LTMatch[]` state being readable from the plugin. Comes directly after Phase 2 is verified.

**Delivers:** `SuggestionPopover.tsx` — click handler on editor DOM, match lookup from plugin state via `ltPluginKey.getState()`, replacement via `editor.chain().deleteRange().insertContent().run()`, dismiss action, viewport-aware positioning via Radix Popover.

**Addresses:** Click-to-fix suggestion popover (table stakes).

**Uses:** Existing shadcn/ui `Popover`; `editor.view.domAtPos()` for DOM coordinate lookup.

**Avoids:** Tiptap UI components (React 19 incompatible); Tiptap BubbleMenu (avoid — uses tippyjs-react, archived without React 19 support).

**Research flag:** Standard patterns — shadcn/ui Popover is well-documented; DOM coordinate positioning is straightforward.

### Phase 4: Feedback Toggle and Toolbar Integration

**Rationale:** Toggle logic depends on the stale-closure ref pattern from Phase 1 and the decoration dispatch mechanism from Phase 2. Low complexity once the foundation is in place.

**Delivers:** Toolbar toggle button with clear on/off visual state and label, toggle-off clears all decorations immediately via empty `DecorationSet` transaction, toggle-on triggers an immediate check, "checking..." indicator during debounce window.

**Addresses:** Toggle to enable/disable live feedback (table stakes).

**Research flag:** Standard patterns — no research needed.

### Phase 5: Structural Heuristics

**Rationale:** Heuristics depend only on `essayText` in Zustand (established in Phase 1) and are entirely independent of the LanguageTool plugin. Can be built in parallel with Phases 3-4, but listed here to keep the critical path clean.

**Delivers:** `useEssayHeuristics.ts` hook (pure `useMemo` computation), `HeuristicFeedbackBanner.tsx` (dismissible info banners rendered below editor, above submit button), four detectors: thesis signal, paragraph count/balance, evidence signals, conclusion signal.

**Addresses:** All four structural heuristic differentiators from FEATURES.md; directly aligned with rubric criteria in the existing grading system.

**Avoids:** Heuristics as ProseMirror decorations (anti-pattern — wrong visual layer; banners are the correct pattern to keep LanguageTool underlines and structural feedback visually distinct).

**Research flag:** Standard patterns — pure TypeScript/regex; signal phrases validated against academic writing guidelines (HIGH confidence heuristics: paragraph balance; MEDIUM confidence: thesis/conclusion/evidence phrase matching).

### Phase 6: Writing Timer

**Rationale:** Timer depends on editor focus events (available after Phase 1). Independent of LanguageTool. Replaces the History toolbar button as specified in PROJECT.md. Listed last among UI phases because it has no blocking dependencies on Phases 2-5.

**Delivers:** `WritingTimer.tsx` — elapsed MM:SS timer starting on first keystroke, pausing on editor blur, resetting on new session; `GradingToolbar.tsx` modified to remove Clock/History link.

**Addresses:** Writing timer (differentiator; explicitly in PROJECT.md scope).

**Research flag:** Standard patterns — `setInterval` + React `useRef`.

### Phase 7: FastAPI Proxy (Conditional)

**Rationale:** Research confirms LanguageTool's public API returns `access-control-allow-origin: *` via curl, but browser CORS behavior must be verified at runtime in Phase 2. The proxy is only built if direct browser fetch fails. Building it last avoids unnecessary backend work.

**Delivers:** `backend/app/routes/lt.py` — thin `httpx` proxy to `https://api.languagetool.org/v2/check`; frontend `VITE_LT_ENDPOINT` env var configures the active endpoint.

**Addresses:** LanguageTool CORS fallback.

**Research flag:** Conditional — implement only if Phase 2 browser CORS testing fails. The proxy pattern (FastAPI + httpx pass-through) is standard.

### Phase Ordering Rationale

- Phases 1-3 are a strict dependency chain: types → editor + sync → decorations → popover. No phase can safely begin before its predecessor is verified working.
- Phase 4 (toggle) and Phase 5 (heuristics) can be built concurrently after Phase 2 completes — they share no dependencies on each other.
- Phase 6 (timer) can technically begin after Phase 1 — it only needs the editor instance for focus events — but is listed last to keep developer focus on the critical path.
- Phase 7 (proxy) is a conditional branch triggered by CORS test results in Phase 2. Build it only if needed.
- The build order minimizes rework: the hardest architectural decisions (sync pattern, decoration plugin, position mapping) are resolved and tested before any UI is built on top of them.

### Research Flags

Phases requiring careful step-by-step validation (research is complete; implementation must be verified before building downstream phases on top):

- **Phase 2:** Position mapping (LT character offsets → ProseMirror positions) is the highest implementation risk. Unit test with a 3+ paragraph essay before proceeding to Phase 3. Cursor stability under async decoration dispatch must also be verified before Phase 4.
- **Phase 7:** LanguageTool CORS in browsers requires runtime verification; confirmed via curl but browser CORS enforcement can differ from command-line clients.

Phases with well-established patterns (proceed directly to implementation):
- **Phase 1:** Tiptap installation and one-way Zustand sync are precisely documented in STACK.md and PITFALLS.md.
- **Phase 3:** shadcn/ui Popover + DOM coordinate positioning is standard.
- **Phase 4:** Toggle boolean + `DecorationSet` clear transaction is straightforward.
- **Phase 5:** Pure computation hook with `useMemo` is standard React.
- **Phase 6:** `setInterval` timer is standard React.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against official docs; React 19 compatibility confirmed with `immediatelyRender: false`; CORS verified via direct curl test returning `access-control-allow-origin: *`; version pinning requirement confirmed via Tiptap docs |
| Features | HIGH | LanguageTool API contract fully documented; Tiptap integration patterns verified via official GitHub and reference implementation; UX patterns validated against Grammarly/QuillBot analysis; heuristic signal phrases validated against academic writing guidelines |
| Architecture | HIGH (Tiptap/ProseMirror); MEDIUM (LanguageTool CORS) | ProseMirror plugin patterns confirmed via Tiptap Extension API docs and GitHub discussion #1012; CORS is the one unconfirmed runtime assumption (needs browser verification in Phase 2) |
| Pitfalls | HIGH | Stale closure verified via Tiptap GitHub issues #2403 and #5831; Zustand sync pitfall verified via Tiptap docs and Liveblocks best practices; position mapping pitfall verified via ProseMirror docs; rate limits verified via official LanguageTool API docs |

**Overall confidence:** HIGH

### Gaps to Address

- **LanguageTool CORS at runtime in the browser:** curl confirms the CORS header, but browser CORS enforcement should be verified early in Phase 2 before building the full plugin. Have the FastAPI proxy route (Phase 7) scoped and ready to activate if needed — the `src/api/languagetool.ts` abstraction already supports switching endpoints via `VITE_LT_ENDPOINT`.

- **Heuristic false-positive rates:** Signal-phrase heuristics (thesis, conclusion, evidence) are calibrated against published academic writing guidelines but have not been validated against real student essays. The signal phrases and word-count thresholds in `useEssayHeuristics.ts` should be treated as v1 starting points. Track dismissal rates in Phase 5 and tune in a subsequent v2.x pass.

- **Rate limit behavior in shared IP environments:** The 20 req/min cap is per IP. In a classroom or demo setting with multiple students behind the same NAT, the effective per-student budget is lower than 20 req/min. The backoff strategy in Phase 2 mitigates this but has not been load-tested. If the product moves beyond demo use, self-hosting LanguageTool (open source, available as Docker image) removes this constraint entirely.

---

## Sources

### Primary (HIGH confidence)

- [Tiptap React installation docs](https://tiptap.dev/docs/editor/getting-started/install/react) — package requirements, `useEditor` hook, `immediatelyRender: false`
- [Tiptap v3 stable release notes](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) — StarterKit changes, open-source extension list
- [Tiptap Extension API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension) — `addProseMirrorPlugins()`, storage, options
- [Tiptap StarterKit extension](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — disabling marks and nodes
- [LanguageTool Public HTTP API](https://dev.languagetool.org/public-http-api.html) — endpoint, rate limits (20 req/min, 20KB/request), attribution requirement
- LanguageTool CORS: verified directly via `curl -D -` against `https://api.languagetool.org/v2/check`
- [tiptap-languagetool reference implementation](https://github.com/sereneinserenade/tiptap-languagetool) — position mapping, decoration extension pattern
- [use-debounce npm](https://www.npmjs.com/package/use-debounce) — v10.1.0, 4.9M weekly downloads, React hooks API
- [Essay Structure Guidelines — Swansea University](https://www.swansea.ac.uk/academic-success/academic-skills-lab/academic_writing_articles/essay-structure/structure-your-essays/) — heuristic signal validation
- Existing codebase: `EssayInput.tsx`, `GradingToolbar.tsx`, `app-store.ts`, `HighlightedEssay.tsx`, `GradingPage.tsx`

### Secondary (MEDIUM confidence)

- [ProseMirror DecorationSet in React — Medium](https://medium.com/@faisalmujtaba/prosemirror-decorationset-in-react-everything-i-wish-someone-had-told-me-6262eabae7ca) — external API decoration patterns
- [Tiptap Issue #2403](https://github.com/ueberdosis/tiptap/issues/2403) — stale closure on `onUpdate` callback
- [Tiptap Issue #5831](https://github.com/ueberdosis/tiptap/issues/5831) — `useEditor` does not update options after re-render
- [ProseMirror Issue #942](https://github.com/ProseMirror/prosemirror/issues/942) — cursor jump on async decoration update
- [Tiptap Issue #5876](https://github.com/ueberdosis/tiptap/issues/5876) — tippyjs-react incompatibility in Pro extensions
- [Tiptap Discussion #1012](https://github.com/ueberdosis/tiptap/discussions/1012) — updating decorations from external state via transaction metadata
- [Grammarly Editor user guide](https://support.grammarly.com/hc/en-us/articles/360003474732-Grammarly-Editor-user-guide) — UX pattern reference
- [QuillBot Essay Checker](https://quillbot.com/essay-checker) — UX pattern reference
- [Tiptap Liveblocks Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips) — `content` vs `initialContent`, controlled component pitfalls

---

*Research completed: 2026-03-12*
*Ready for roadmap: yes*
