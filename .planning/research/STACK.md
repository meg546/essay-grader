# Stack Research

**Domain:** Live essay feedback — rich text editor with inline grammar/spelling decorations
**Researched:** 2026-03-12
**Confidence:** HIGH
**Scope:** NEW additions for v2.2 milestone only. Existing stack (React 19, Vite 7, TypeScript, Tailwind v4, Zustand, React Router v7, motion, shadcn/ui) is validated and unchanged.

---

## New Dependencies Required

### Core Editor

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tiptap/react | ^3.20.1 | React bindings + useEditor hook + EditorContent component | Tiptap v3 is the standard headless editor for React. The useEditor hook owns editor lifecycle; EditorContent renders to DOM. Replaces textarea without adding formatting UI you don't need. |
| @tiptap/pm | ^3.20.1 | ProseMirror internals (prosemirror-state, prosemirror-view, prosemirror-model) | Required peer dependency since Tiptap v3. Provides the Plugin, PluginKey, Decoration, and DecorationSet APIs needed to implement inline underlines. Must be installed alongside @tiptap/react. |
| @tiptap/starter-kit | ^3.20.1 | Default extension bundle (Document, Paragraph, Text, History, etc.) | Provides the document schema. In v3 it now includes Underline, Link, and ListKeymap by default. Use with `{ bold: false, italic: false, heading: false, ...}` to disable formatting extensions you don't need for plain-text essay input. |
| @tiptap/extension-placeholder | ^3.20.0 | Empty-editor placeholder text | Tiptap's placeholder is CSS-based (not a real DOM node), so it doesn't interfere with content. Needed to show "Start typing your essay..." hint. Install separately — not included in starter-kit. |

**Version note:** All `@tiptap/*` packages must be the same minor version. As of 2026-03-12 the latest stable is 3.20.x. Pin them together. Mismatched Tiptap versions cause subtle plugin registration failures.

### Debounce

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| use-debounce | ^10.1.0 | useDebouncedCallback hook for LanguageTool API calls | ~1KB, React-native hooks API, handles cleanup correctly on unmount. The LanguageTool free tier cap is 20 req/min (peak). A 3-second debounce on onChange means at most ~20 req/min under active typing. Avoids lodash.debounce + useMemo boilerplate. |

### No Additional Dependencies Needed

| Feature | How It Is Implemented | Reason No New Dep |
|---------|-----------------------|-------------------|
| LanguageTool API calls | Native `fetch` (or existing Axios) via `POST https://api.languagetool.org/v2/check` | LanguageTool returns `Access-Control-Allow-Origin: *` (verified 2026-03-12 via curl). Direct browser calls work. No proxy needed. |
| ProseMirror decorations (inline underlines) | `@tiptap/pm` already provides `Decoration`, `DecorationSet` from `prosemirror-view` | Decoration API is part of ProseMirror core, shipped inside `@tiptap/pm`. No separate prosemirror-* packages needed. |
| Suggestion popovers | shadcn/ui Popover (already in project) | The project already uses shadcn/ui. The Popover primitive handles positioning and click-outside dismiss without a new dependency. |
| Client-side essay heuristics | Plain TypeScript functions | Thesis/paragraph/conclusion detection is string manipulation. No NLP library needed for pattern-matching heuristics at this scope. |
| Writing timer | React state + `setInterval` | A countdown/elapsed timer is a standard React pattern with no library requirement. |
| Toggleable feedback state | Zustand (already in project) | A single boolean `feedbackEnabled` in the existing store. No new state library needed. |

---

## React 19 Compatibility

**Status: Compatible with caveats** (MEDIUM confidence — core packages verified, Pro extensions excluded)

- `@tiptap/react` 3.x core packages work with React 19. Confirmed by community reports and the Tiptap team. The SSR hydration issue is irrelevant here (Vite SPA, no SSR).
- **Required config:** Pass `immediatelyRender: false` to `useEditor()`. Without this, ProseMirror tries to access the DOM before React mounts, causing warnings with React 19's stricter rendering.
- **Do not use Tiptap Pro extensions** (drag-handle, etc.). They depend on `tippyjs-react` which was archived without React 19 support. This project uses no Pro extensions, so this is not a concern.
- **Do not use `@tiptap/ui-components`** — the Tiptap UI components package is explicitly documented as requiring React 18. This project builds its own toolbar using shadcn/ui, so this is not a concern.

---

## Installation

```bash
# Tiptap editor core (all must be same version)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder

# Debounce hook
npm install use-debounce
```

No backend changes. No new Vite plugins. No new Tailwind plugins.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @tiptap/react | Slate.js | Slate is more flexible for custom schemas but has a steeper API surface for a use case that needs plain-text + decorations only. Tiptap's extension model is simpler for wrapping LanguageTool results into decorations. |
| @tiptap/react | CodeMirror 6 | CodeMirror excels at code editing. Its decoration and linting APIs are excellent but are designed around code, not prose. Integration with React state is more complex. |
| @tiptap/react | Quill | Quill 2 is available but has limited TypeScript support and its decoration equivalent (formats) is not designed for spell-check use cases. Tiptap is the clear winner in the React ecosystem. |
| @tiptap/react | Draft.js | Deprecated by Meta. Do not use. |
| use-debounce | lodash.debounce + useMemo | Functionally identical, but requires two packages and more boilerplate to correctly memoize the debounced function across renders. use-debounce encapsulates the pattern correctly. |
| use-debounce | @react-hook/debounce | Smaller community, less documentation. use-debounce (4.9M weekly downloads) is the community standard. |
| Direct fetch to api.languagetool.org | FastAPI proxy route | A proxy adds latency and backend complexity. LanguageTool's CORS wildcard makes a proxy unnecessary. Use direct browser calls. If rate limits become an issue, add proxy then. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @tiptap/ui-components | Requires React 18. Will break with this project's React 19. | Build toolbar with shadcn/ui Button and Toggle components. |
| Any Tiptap Pro extension | Pro extensions depend on tippyjs-react which is archived without React 19 support. | All needed features are achievable with open-source extensions. |
| prosemirror-* packages installed directly | @tiptap/pm re-exports all ProseMirror internals. Installing prosemirror-state etc. directly can cause duplicate ProseMirror instances (two copies of the same module), breaking decoration reconciliation. | Always import from @tiptap/pm: `import { Plugin, PluginKey } from '@tiptap/pm/state'` |
| Draft.js | Deprecated. | @tiptap/react |
| Slate.js | Over-engineered for plain-text + decoration use case. Tiptap is simpler here. | @tiptap/react |
| react-quill / Quill | React 19 compatibility unknown; QuillJS decoration model is not designed for spell-check overlays. | @tiptap/react |
| NLP.js / compromise / natural | Full NLP libraries for client-side heuristics. Overkill — structural heuristics (paragraph count, sentence length, keyword signals) are achievable with regex and string methods. | Plain TypeScript |

---

## ProseMirror Decoration Pattern (Tiptap)

The inline underline pattern for LanguageTool errors is implemented as a custom Tiptap Extension using `addProseMirrorPlugins`. This is the correct approach — decorations live in ProseMirror world, not React state.

```typescript
// Conceptual pattern — not an implementation spec
import { Extension } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const LtPluginKey = new PluginKey('languagetool')

const LanguageToolExtension = Extension.create({
  name: 'languageTool',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: LtPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, oldSet) {
            // Read matches from transaction metadata, map existing decorations
            const matches = tr.getMeta(LtPluginKey)
            if (matches) {
              const decorations = matches.map((m: LtMatch) =>
                Decoration.inline(m.offset, m.offset + m.length, {
                  class: `lt-${m.rule.issueType}`, // e.g. lt-misspelling, lt-grammar
                })
              )
              return DecorationSet.create(tr.doc, decorations)
            }
            return oldSet.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return LtPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
```

Key points for implementation:
- Import ProseMirror types from `@tiptap/pm/state` and `@tiptap/pm/view`, never from `prosemirror-state` directly.
- Use `tr.getMeta(pluginKey)` to pass LanguageTool results from React into ProseMirror's transaction system.
- `oldSet.map(tr.mapping, tr.doc)` keeps decorations correctly positioned as the user types (positions shift with insertions/deletions).
- CSS classes on decorations (`lt-misspelling`, `lt-grammar`, `lt-style`) are styled with Tailwind's arbitrary CSS or a small global stylesheet (wavy underlines cannot be done with Tailwind utilities — use `text-decoration: underline wavy` in globals.css).

---

## LanguageTool API Contract

**Endpoint:** `POST https://api.languagetool.org/v2/check`
**CORS:** `Access-Control-Allow-Origin: *` confirmed (direct browser calls work)
**Content-Type:** `application/x-www-form-urlencoded`

Key request parameters:
- `text` — essay content (plain text from editor.getText())
- `language` — `en-US` (hardcode; PROJECT.md specifies English only)

Key response fields per match:
- `offset` + `length` — character positions for Decoration.inline()
- `message` — human-readable description for popover
- `shortMessage` — compact label
- `replacements[].value` — suggested fix text (up to 30 for misspellings)
- `rule.issueType` — `misspelling` | `grammar` | `style` (drives CSS class)
- `rule.category.id` — granular category (TYPOS, GRAMMAR, etc.)

**Rate limit:** 20 requests/minute per IP (peak, not sustained). At 3-second debounce with active typing, worst case is ~20 req/min. The debounce fires on `onUpdate` only when content actually changes.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @tiptap/react ^3.20.1 | React ^19.2.0 | Core packages compatible. Must add `immediatelyRender: false` to useEditor config. |
| @tiptap/pm ^3.20.1 | @tiptap/react ^3.20.1 | Must match @tiptap/react minor version exactly. |
| @tiptap/starter-kit ^3.20.1 | @tiptap/react ^3.20.1 | Must match @tiptap/react minor version exactly. |
| @tiptap/extension-placeholder ^3.20.0 | @tiptap/react ^3.20.1 | Patch version can differ; minor must match. |
| use-debounce ^10.1.0 | React ^19.2.0 | No peer dependency conflicts. Framework-agnostic hook. |
| All @tiptap/* | Vite ^7.3.1 | Tiptap packages are ESM-native. No Vite config changes needed. |
| All @tiptap/* | TypeScript ~5.9.3 | Full TypeScript types included in all @tiptap packages. No @types/* needed. |

---

## Stack Patterns

**For plain-text editor (this project):**
- Disable all formatting extensions in StarterKit: `bold: false, italic: false, strike: false, code: false, codeBlock: false, blockquote: false, heading: false, horizontalRule: false`
- Keep: `history: true` (undo/redo), `paragraph: true`, `document: true`, `text: true`
- Do NOT add Underline mark from StarterKit — the underlines used for LanguageTool are ProseMirror Decorations (no document mutations), not marks (which modify the document and appear in serialized content).

**For wavy underline CSS (not achievable with Tailwind utilities):**
```css
/* Add to src/index.css or src/globals.css */
.lt-misspelling { text-decoration: underline wavy #ef4444; }
.lt-grammar     { text-decoration: underline wavy #3b82f6; }
.lt-style       { text-decoration: underline wavy #a855f7; }
```

**For popover on underline click:**
- Attach a `click` event listener via `editor.view.dom.addEventListener('click', handler)` in a `useEffect`.
- Inspect click position with `editor.view.posAtCoords({ left, top })`.
- Retrieve decoration metadata from `LtPluginKey.getState(editor.state)` to find the match at that position.
- Use shadcn/ui Popover (already available) to display replacements. No new dependency.

---

## Sources

- [Tiptap React installation docs](https://tiptap.dev/docs/editor/getting-started/install/react) — confirmed @tiptap/pm requirement, useEditor hook, immediatelyRender: false
- [Tiptap v3 stable release notes](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) — StarterKit changes, Floating UI migration, open-source extensions list
- [Tiptap React 19 issue #5876](https://github.com/ueberdosis/tiptap/issues/5876) — tippyjs-react incompatibility in Pro extensions (does not affect core packages)
- [LanguageTool public HTTP API](https://dev.languagetool.org/public-http-api.html) — rate limits (20 req/min, 75KB/min, 20KB/request)
- LanguageTool API CORS: verified directly via `curl -D -` against `https://api.languagetool.org/v2/check` — returns `access-control-allow-origin: *` (HIGH confidence, direct test)
- [use-debounce npm](https://www.npmjs.com/package/use-debounce) — v10.1.0, 4.9M weekly downloads, React hooks API
- [ProseMirror DecorationSet in React](https://medium.com/@faisalmujtaba/prosemirror-decorationset-in-react-everything-i-wish-someone-had-told-me-6262eabae7ca) — decoration state pattern (MEDIUM confidence, community article)
- [Tiptap Extension API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension) — addProseMirrorPlugins confirmed

---
*Stack research for: AI Essay Grader v2.2 Live Essay Feedback*
*Researched: 2026-03-12*
