# Architecture Research

**Domain:** Live essay feedback integration — Tiptap editor, LanguageTool decorations, heuristic analysis, writing timer
**Researched:** 2026-03-12
**Confidence:** HIGH for Tiptap/ProseMirror patterns, MEDIUM for LanguageTool CORS behavior (requires runtime verification)

---

## Existing Architecture (What We Are Integrating Into)

Before describing new components, the existing architecture must be understood precisely because the integration must be surgical — not a rewrite.

```
GradingPage.tsx
  ├── EssayInput.tsx          ← REPLACED by TiptapEssayEditor.tsx
  ├── GradingToolbar.tsx      ← MODIFIED (replace History link with WritingTimer)
  ├── WordStats.tsx           ← UNTOUCHED (remains below editor area)
  └── [results mode]
        ├── EssayPanel.tsx    ← UNTOUCHED (uses HighlightedEssay, not Tiptap)
        └── FeedbackPanel.tsx ← UNTOUCHED

app-store.ts (Zustand, persisted)
  essayText: string           ← Tiptap syncs plain text here via onUpdate
  textSize: TextSize          ← Tiptap reads this for font size class
  setEssayText()              ← Called from Tiptap's onUpdate
```

### What Must Not Break

- `essayText` in `app-store.ts` is the single source of truth consumed by `GradingPage.handleSubmit()`, `WordStats`, `EssayPanel`, and the submit button disabled state. Tiptap must keep this field current.
- `HighlightedEssay.tsx` is a read-only span-based renderer used in the results view. It does not use Tiptap and must remain untouched. Tiptap is only for the input view.
- `EssayInput.tsx` has a `forwardRef` exposing `triggerFileUpload()` used by `GradingToolbar` → `EssayUploadModal`. The replacement component must preserve this ref interface.
- `GradingToolbar.tsx` receives `onUploadEssayFile` from `GradingPage` and calls `essayInputRef.current?.triggerFileUpload()`. The ref type must stay compatible.

---

## System Overview: New Components and Their Relationships

```
GradingPage.tsx
  │
  ├─ TiptapEssayEditor.tsx (NEW — replaces EssayInput.tsx)
  │    ├── useEditor (Tiptap hook)
  │    │    ├── StarterKit (configured for plain text only)
  │    │    ├── LanguageToolExtension (NEW — custom Tiptap Extension)
  │    │    │    └── addProseMirrorPlugins() → LanguageToolPlugin
  │    │    │         ├── Plugin state: LTMatch[]
  │    │    │         └── props.decorations() → DecorationSet (wavy underlines)
  │    │    └── onUpdate → editor.getText() → store.setEssayText()
  │    │
  │    ├── SuggestionPopover.tsx (NEW — shown on decoration click)
  │    └── file drag-drop + hidden input (preserved from EssayInput.tsx)
  │
  ├─ GradingToolbar.tsx (MODIFIED — Clock icon becomes WritingTimer)
  │    └── WritingTimer.tsx (NEW — inlined or separate component)
  │
  ├─ HeuristicFeedbackBanner.tsx (NEW — rendered below editor, above submit)
  │    └── useEssayHeuristics(essayText) hook (NEW — pure computation)
  │
  └─ WordStats.tsx (UNTOUCHED)

src/api/languagetool.ts (NEW — LanguageTool API layer)
  └── checkText(text: string): Promise<LTMatch[]>

src/lib/languagetool-types.ts (NEW — shared types)
  └── LTMatch, LTReplacement, LTRule interfaces
```

---

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `TiptapEssayEditor.tsx` | Replaces textarea; hosts Tiptap instance; syncs plain text to Zustand; handles file drop | `app-store.ts` (write), `LanguageToolExtension` (via editor), `GradingPage` (ref) |
| `LanguageToolExtension` | Tiptap Extension wrapping the ProseMirror plugin; debounces API calls; dispatches decoration transactions | `src/api/languagetool.ts` (async fetch), ProseMirror view (dispatch) |
| `LanguageToolPlugin` | ProseMirror Plugin; owns `LTMatch[]` state; renders `DecorationSet` with inline underlines | ProseMirror state machine |
| `SuggestionPopover.tsx` | Click handler attached to decorated spans; shows fix suggestions; applies replacement | `LanguageToolExtension` (dispatch apply-fix transaction) |
| `HeuristicFeedbackBanner.tsx` | Renders structural feedback (thesis, paragraphs, evidence, conclusion) as dismissible info banners | `useEssayHeuristics` hook, no Zustand needed |
| `useEssayHeuristics(text)` | Pure computation hook; runs regex/heuristics on plain text; returns structured feedback items | `app-store.ts` (read `essayText`) |
| `WritingTimer.tsx` | Tracks elapsed session time; starts on first keystroke; pauses on blur; displays HH:MM | `app-store.ts` (optional: read `essayText` to detect session start) |
| `src/api/languagetool.ts` | HTTP POST to LanguageTool endpoint; maps response to `LTMatch[]`; handles errors silently | External LanguageTool endpoint or FastAPI proxy |

---

## Recommended Project Structure (New Files Only)

```
src/
├── components/
│   └── grading/
│       ├── EssayInput.tsx              ← DELETED (replaced)
│       ├── TiptapEssayEditor.tsx       ← NEW (drop-in replacement)
│       ├── SuggestionPopover.tsx       ← NEW (popover on decoration click)
│       ├── HeuristicFeedbackBanner.tsx ← NEW (structural banners below editor)
│       └── WritingTimer.tsx            ← NEW (timer replacing History link)
│
├── extensions/
│   └── language-tool/
│       ├── index.ts                    ← NEW (re-exports extension)
│       ├── LanguageToolExtension.ts    ← NEW (Tiptap Extension.create())
│       ├── LanguageToolPlugin.ts       ← NEW (ProseMirror Plugin with state)
│       └── decoration-builder.ts      ← NEW (builds DecorationSet from LTMatch[])
│
├── hooks/
│   └── useEssayHeuristics.ts          ← NEW (pure heuristic analysis)
│
├── api/
│   └── languagetool.ts                ← NEW (API layer for LT requests)
│
└── lib/
    └── languagetool-types.ts          ← NEW (LTMatch, LTReplacement, LTRule)
```

### Structure Rationale

- **`src/extensions/language-tool/`**: The ProseMirror plugin has enough complexity (state machine, decoration building, debounce logic) to warrant its own folder. Co-locating the Extension, Plugin, and decoration builder keeps this subsystem self-contained.
- **`src/hooks/useEssayHeuristics.ts`**: Pure computation with no side effects — a hook that takes text and returns feedback items. Isolated for testability.
- **`src/api/languagetool.ts`**: Follows the existing API layer pattern (alongside `grading.ts`, `auth.ts`). All external HTTP calls live in `src/api/`.

---

## Architectural Patterns

### Pattern 1: Tiptap for Plain Text (Minimal Extension Set)

**What:** Configure StarterKit with all formatting marks and structural nodes disabled. Keep only Document, Paragraph, Text, HardBreak.

**When to use:** This is the only correct approach — Tiptap's default StarterKit enables bold, italic, headings, lists, etc. These must be explicitly disabled to enforce plain text.

**Trade-offs:** Tiptap is heavier than a textarea (~50KB gzip for core + ProseMirror). Justified because the ProseMirror plugin layer is the only clean way to render inline decorations without reimplementing a text editor.

**Example:**
```typescript
// TiptapEssayEditor.tsx
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      bold: false,
      italic: false,
      code: false,
      strike: false,
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
      horizontalRule: false,
      // Keep: document, paragraph, text, hardBreak, history, dropcursor, gapcursor
    }),
    LanguageToolExtension.configure({
      enabled: true,
      debounceMs: 3000,
    }),
    CharacterCount,  // for word/char count if replacing WordStats
  ],
  content: essayText,  // initial value from Zustand store
  onUpdate: ({ editor }) => {
    setEssayText(editor.getText({ blockSeparator: '\n\n' }));
  },
})
```

### Pattern 2: ProseMirror Plugin with Transaction Metadata Bridge

**What:** The LanguageTool plugin stores `LTMatch[]` as plugin state. External results (from the async API call) are fed back into the plugin via a transaction with custom metadata. The plugin's `apply()` function checks for this metadata to rebuild decorations.

**When to use:** Any time you need to update ProseMirror decorations from outside the editor's normal transaction flow (e.g., async API responses).

**Trade-offs:** Slightly indirect (data goes: API response → dispatch transaction → plugin apply → DecorationSet). This is the correct ProseMirror pattern — never mutate plugin state directly from outside the plugin.

**Example:**
```typescript
// LanguageToolPlugin.ts
const ltPluginKey = new PluginKey<LTMatch[]>('languageTool');

const LanguageToolPlugin = new Plugin<LTMatch[]>({
  key: ltPluginKey,
  state: {
    init: () => [],
    apply: (tr, prev) => {
      const incoming = tr.getMeta(ltPluginKey);
      if (incoming !== undefined) return incoming;        // new API results
      if (tr.docChanged) return prev.map(m => mapMatch(m, tr.mapping)); // remap on edit
      return prev;
    },
  },
  props: {
    decorations: (state) => {
      const matches = ltPluginKey.getState(state) ?? [];
      return buildDecorationSet(state.doc, matches);
    },
  },
});

// From LanguageToolExtension, after API response:
editor.view.dispatch(
  editor.state.tr.setMeta(ltPluginKey, matches)
);
```

### Pattern 3: Debounced API Calls via Extension Options

**What:** The `LanguageToolExtension` holds a debounce timer ref. The Tiptap `onUpdate` callback (or the extension's `onUpdate` hook) triggers the debounced fetch. The 3-second debounce prevents API calls on every keystroke.

**When to use:** Always for LanguageTool. Rate limit is 20 requests/minute. A 3-second debounce on a typical typist (~60 WPM) results in ~1 request per 3 seconds of sustained typing, well within limits.

**Trade-offs:** 3 seconds feels long but is appropriate given the free tier limit. Users see existing decorations during the debounce window.

**Example:**
```typescript
// Inside LanguageToolExtension
onUpdate({ editor }) {
  clearTimeout(this.storage.debounceTimer);
  this.storage.debounceTimer = setTimeout(async () => {
    if (!this.options.enabled) return;
    const text = editor.getText({ blockSeparator: '\n\n' });
    if (text.trim().length < 20) return;  // skip very short text
    try {
      const matches = await checkText(text);
      editor.view.dispatch(
        editor.state.tr.setMeta(ltPluginKey, matches)
      );
    } catch {
      // silent fail — live feedback is non-critical
    }
  }, this.options.debounceMs ?? 3000);
},
```

### Pattern 4: Plain Text Sync to Zustand via onUpdate

**What:** The Tiptap `onUpdate` callback extracts plain text and writes it to `app-store.essayText`. This is a one-way sync: Tiptap → Zustand. The store is the source of truth for submission, not the editor's internal ProseMirror document.

**When to use:** Always. This is the integration seam between the new editor and the existing submission flow.

**Trade-offs:** Two representations of the essay exist simultaneously: ProseMirror doc (editor's internal state) and string (Zustand). They are always in sync because `onUpdate` fires on every change. `editor.getText({ blockSeparator: '\n\n' })` preserves paragraph breaks as double newlines, matching what the existing textarea produced.

**Initial value:** When `TiptapEssayEditor` mounts, if `essayText` in the store is non-empty (user previously typed or loaded from file), set it as Tiptap's initial content via the `content` option in `useEditor`. Do not use `editor.commands.setContent()` in a `useEffect` — that triggers `onUpdate` and causes a circular write.

### Pattern 5: Heuristics as Pure Computation (Not ProseMirror)

**What:** Essay structure heuristics (thesis detection, paragraph length, evidence signals, conclusion check) run as a plain JavaScript hook on the plain text string from Zustand — not inside ProseMirror.

**When to use:** Always. Heuristics are structural, not inline. They produce document-level feedback ("Your essay has 2 paragraphs — try for at least 4") that belongs in banners below the editor, not as inline underlines. Keeping them outside ProseMirror avoids plugin complexity and makes them trivially testable.

**Trade-offs:** Heuristics run on every render that `essayText` changes. For reasonable essay lengths (<20KB), regex and string operations are imperceptible. Debounce heuristic recalculation inside the hook with `useMemo` or a 500ms `useDebounce` if profiling shows cost.

**Heuristic signals to detect:**
```typescript
// useEssayHeuristics.ts
interface HeuristicFeedback {
  id: string;
  type: 'info' | 'warning';
  message: string;
}

function useEssayHeuristics(text: string): HeuristicFeedback[] {
  return useMemo(() => {
    const results: HeuristicFeedback[] = [];
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const wordCount = text.trim().split(/\s+/).length;

    // Thesis: check if first paragraph contains strong claim signals
    const firstPara = paragraphs[0] ?? '';
    const thesisSignals = /\b(argue|argues|argue that|thesis|claim|believe|contend|this essay)\b/i;
    if (wordCount > 100 && !thesisSignals.test(firstPara)) {
      results.push({ id: 'thesis', type: 'info', message: 'Consider stating your thesis clearly in the opening paragraph.' });
    }

    // Paragraph count
    if (wordCount > 150 && paragraphs.length < 3) {
      results.push({ id: 'paragraphs', type: 'info', message: `${paragraphs.length} paragraph${paragraphs.length !== 1 ? 's' : ''} detected. Strong essays typically have 4–6 paragraphs.` });
    }

    // Evidence signals
    const evidenceSignals = /\b(for example|for instance|according to|evidence|research|studies|data|source|quote)\b/i;
    if (wordCount > 200 && !evidenceSignals.test(text)) {
      results.push({ id: 'evidence', type: 'info', message: 'No evidence signals detected. Consider adding supporting examples or citations.' });
    }

    // Conclusion: last paragraph signals
    const lastPara = paragraphs[paragraphs.length - 1] ?? '';
    const conclusionSignals = /\b(in conclusion|in summary|to summarize|therefore|thus|overall|in closing)\b/i;
    if (wordCount > 200 && paragraphs.length > 2 && !conclusionSignals.test(lastPara)) {
      results.push({ id: 'conclusion', type: 'info', message: 'Your final paragraph may not signal a conclusion. Consider using a concluding transition.' });
    }

    return results;
  }, [text]);
}
```

### Pattern 6: Writing Timer as Self-Contained Component

**What:** `WritingTimer.tsx` is a React component that manages its own timer state (`useRef` for interval, `useState` for elapsed seconds). It starts on the first `essayText` write that transitions from empty to non-empty, and pauses when the editor loses focus.

**When to use:** Replace the `Clock` icon + History link in `GradingToolbar` with this component. The timer does not need Zustand — it is session-local UI state.

**Trade-offs:** Timer state is lost on page refresh. This is acceptable — it's a session writing tool, not a persistent record.

---

## Data Flow

### Live Feedback Flow (Happy Path)

```
User types in TiptapEssayEditor
    ↓ (Tiptap onUpdate fires)
editor.getText() → store.setEssayText(text)       [sync, every keystroke]
    ↓
debounce timer resets (3 seconds)
    ↓ (after 3s of no typing)
checkText(text) → POST https://api.languagetool.org/v2/check
    ↓ (or FastAPI proxy /api/lt/check if CORS blocked)
LTMatch[] returned
    ↓
editor.view.dispatch(tr.setMeta(ltPluginKey, matches))
    ↓
Plugin apply() receives new matches → updates plugin state
    ↓
Plugin props.decorations() fires → builds DecorationSet
    ↓
ProseMirror re-renders with wavy underlines over error ranges
```

### Fix Application Flow

```
User clicks underlined text
    ↓
SuggestionPopover renders with replacements[]
    ↓
User clicks a replacement
    ↓
editor.chain().deleteRange({from, to}).insertContent(replacement).run()
    ↓
Document changes → plugin apply() remaps remaining matches → decorations update
```

### Submission Flow (Unchanged from v2.1)

```
User clicks "Submit for Grading"
    ↓
GradingPage.handleSubmit() reads store.essayText  ← unchanged
    ↓
gradeEssay(essayText, gradeLevel, rubricFile)      ← unchanged
    ↓
setCurrentResult(result) → results view renders    ← unchanged
    ↓
TiptapEssayEditor unmounts, HighlightedEssay renders ← unchanged
```

### Plain Text Sync Detail

```
TiptapEssayEditor mounts
    ├── initial content: useEditor({ content: store.essayText })
    └── onUpdate: ({ editor }) => store.setEssayText(editor.getText({ blockSeparator: '\n\n' }))

File drop/paste into TiptapEssayEditor
    └── editor.commands.setContent(text, false)  ← false = don't emit update (avoid double write)
        or editor.commands.insertContent(text) for append
```

---

## Integration Points

### LanguageTool CORS: Critical Decision Point

**Status:** MEDIUM confidence — requires runtime verification.

The public LanguageTool API (`https://api.languagetool.org/v2/check`) does not reliably support CORS from browser origins. The browser addon works because browser extensions have elevated network permissions that bypass CORS.

**Two options, in order of preference:**

**Option A (Recommended): FastAPI proxy endpoint**
Add a lightweight proxy route to the existing FastAPI backend:

```python
# backend/app/lt/router.py
@router.post("/lt/check")
async def proxy_languagetool(request: Request):
    body = await request.body()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.languagetool.org/v2/check",
            content=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
    return Response(content=resp.content, media_type="application/json")
```

Frontend then calls `http://localhost:8000/api/lt/check` — same origin as the grading API, no CORS issue. The FastAPI backend already runs during development.

**Option B: Direct browser fetch (verify at build time)**
Try `fetch('https://api.languagetool.org/v2/check', ...)` directly and check for CORS error. Some reports indicate the public API does allow browser access. If it works, no proxy needed.

**Decision rule:** Implement Option A first (proxy). If the backend is not running (frontend-only dev mode), fall back to Option B with a try/catch. The `src/api/languagetool.ts` layer abstracts this choice.

```typescript
// src/api/languagetool.ts
const LT_ENDPOINT = import.meta.env.VITE_LT_ENDPOINT
  ?? 'http://localhost:8000/api/lt/check';
  // fallback: 'https://api.languagetool.org/v2/check'

export async function checkText(text: string): Promise<LTMatch[]> {
  const params = new URLSearchParams({
    text,
    language: 'en-US',
    disabledRules: 'WHITESPACE_RULE',
  });
  const resp = await fetch(LT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.matches ?? [];
}
```

### LanguageTool Response Types

```typescript
// src/lib/languagetool-types.ts
export interface LTMatch {
  message: string;
  shortMessage: string;
  offset: number;       // 0-based char offset in the submitted text
  length: number;       // span length
  replacements: LTReplacement[];
  rule: LTRule;
  type: { typeName: 'misspelling' | 'grammar' | 'style' | 'hint' | 'other' };
}

export interface LTReplacement {
  value: string;
}

export interface LTRule {
  id: string;
  description: string;
  category: { id: string; name: string };
}
```

### Tiptap ↔ LanguageTool Offset Alignment

**Critical:** LanguageTool operates on the raw text string. ProseMirror operates on a document with structural nodes. The offsets in `LTMatch` are character positions in the string passed to the API.

The plain text extracted via `editor.getText({ blockSeparator: '\n\n' })` must match exactly what is sent to LanguageTool. Use `\n\n` as the paragraph separator because ProseMirror's Paragraph nodes are separated by this in the serialized form.

To map `LTMatch.offset` to ProseMirror positions, use `editor.state.doc.resolve()` after converting character offsets to ProseMirror positions:

```typescript
// decoration-builder.ts
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export function buildDecorationSet(doc: any, matches: LTMatch[]): DecorationSet {
  const decorations: Decoration[] = [];
  let textPos = 0;  // position in plain text string
  let pmPos = 0;    // position in ProseMirror document

  // Walk the doc to build a text→PM position map
  // This is the canonical way to align LT offsets with PM positions
  doc.nodesBetween(0, doc.content.size, (node: any, pos: number) => {
    if (node.isText) {
      const from = pos;
      const to = pos + node.nodeSize;
      // ... map LT match offsets that fall in this text node
    }
  });

  return DecorationSet.create(doc, decorations);
}
```

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| TiptapEssayEditor ↔ app-store | Direct Zustand subscribe/set | One-way: editor → store on every change |
| TiptapEssayEditor ↔ GradingPage | `forwardRef` with `EssayInputHandle` (triggerFileUpload) | Must preserve existing ref interface |
| LanguageToolExtension ↔ Plugin | Transaction metadata via `PluginKey` | Standard ProseMirror pattern |
| HeuristicFeedbackBanner ↔ app-store | Read `essayText` via Zustand selector | Read-only, reacts to debounced text changes |
| WritingTimer ↔ TiptapEssayEditor | `onFocus`/`onBlur` events or GradingPage state | Timer starts/pauses based on editor focus |

---

## Anti-Patterns

### Anti-Pattern 1: Using Tiptap for Rich Text in This Editor

**What people do:** Use Tiptap's default StarterKit without disabling marks; allow users to paste formatted HTML.

**Why it's wrong:** The grading backend receives plain text. Rich text formatting (bold spans, headings) becomes garbage characters in the graded text. Highlight offsets computed against plain text won't align with a formatted document.

**Do this instead:** Disable all marks and block nodes except Paragraph and Text. Configure `editorProps.transformPastedHTML` to strip formatting on paste.

### Anti-Pattern 2: Storing Decorations in Zustand

**What people do:** Manage `LTMatch[]` in a Zustand store and try to read it in a component that then imperatively updates the editor.

**Why it's wrong:** Breaks ProseMirror's transaction model. Decorations must live inside the ProseMirror plugin state to survive document changes and position remapping. External state cannot track document version for offset validity.

**Do this instead:** Plugin state owns the matches. React state (if needed for the toggle UI) can hold an "enabled" boolean. The plugin reads `enabled` from extension options, which are updated via `editor.setOptions()`.

### Anti-Pattern 3: Direct API Call on Every Keystroke

**What people do:** Call LanguageTool in the Tiptap `onUpdate` callback without debouncing.

**Why it's wrong:** Rate limit is 20 requests/minute per IP. A typical user types 60+ WPM, which would exceed the limit within the first minute. The API will return 429 errors, decorations will disappear, and the user gets a broken experience.

**Do this instead:** Debounce at 3 seconds. Clear the timer on each keystroke. Only fire when typing stops.

### Anti-Pattern 4: Initializing Tiptap Content from Zustand in a useEffect

**What people do:**
```typescript
useEffect(() => {
  if (editor && essayText) editor.commands.setContent(essayText);
}, [editor, essayText]);
```

**Why it's wrong:** `setContent()` triggers `onUpdate`, which calls `setEssayText()`, which updates `essayText`, which triggers the effect again. Infinite loop. Also loses the user's cursor position on every Zustand store update.

**Do this instead:** Pass `essayText` as the `content` option in `useEditor()` for initialization only. The editor owns the content after mount; Zustand receives updates from the editor, not the reverse.

### Anti-Pattern 5: Heuristics as ProseMirror Decorations

**What people do:** Add thesis/evidence heuristic results as inline underlines via the ProseMirror plugin.

**Why it's wrong:** Heuristics are structural — they apply to the entire document or whole paragraphs. Mapping them to precise character offsets is fragile (which character of "the introduction" is the thesis?). Visually, mixing heuristic highlights with LanguageTool grammar underlines creates noise that confuses students.

**Do this instead:** Render heuristics as banners below the editor. They're informational, not corrections. Keep the inline decoration layer exclusively for LanguageTool grammar/spelling matches.

### Anti-Pattern 6: Replacing HighlightedEssay with Tiptap in Results View

**What people do:** Render the results view using Tiptap instead of the existing `HighlightedEssay` component.

**Why it's wrong:** `HighlightedEssay` uses a completely different data model (highlight ranges from the grading API, category-colored spans, tooltip-on-hover). Tiptap's decoration system is not designed for this bidirectional interaction with `HighlightContext`. Replacing it would require significant rearchitecting of the results flow for no gain.

**Do this instead:** Keep `HighlightedEssay` untouched. Tiptap is only in the input view. The two modes (input vs. results) are already separate branches in `GradingPage.tsx`.

---

## Build Order (Phase Dependency Chain)

Each phase can only start when its dependencies are complete.

| Phase | What to Build | Depends On | Rationale |
|-------|--------------|-----------|-----------|
| 1 | `src/lib/languagetool-types.ts` + `src/api/languagetool.ts` | Nothing | Types and API layer have no dependencies; define the data contract first |
| 2 | `TiptapEssayEditor.tsx` (Tiptap only, no LanguageTool yet) | Phase 1 (types) | Establish the editor, plain text sync, file handling, ref interface. Validate that Zustand sync works before adding decoration complexity |
| 3 | `LanguageToolExtension.ts` + `LanguageToolPlugin.ts` + `decoration-builder.ts` | Phase 2 (editor running) | Plugin needs a working editor to attach to; decoration rendering needs ProseMirror document to decorate |
| 4 | `SuggestionPopover.tsx` | Phase 3 (decorations rendered) | Popover needs decorated spans to be clickable before it can trigger |
| 5 | `useEssayHeuristics.ts` + `HeuristicFeedbackBanner.tsx` | Phase 2 (`essayText` in store) | Heuristics read plain text from store; Phase 2 ensures that sync is solid |
| 6 | `WritingTimer.tsx` + `GradingToolbar.tsx` modification | Phase 2 (editor focus events available) | Timer needs to hook into editor focus/blur; can be added after editor is stable |
| 7 | FastAPI proxy endpoint `/api/lt/check` (optional) | Phases 1–6 complete | Only needed if direct browser CORS fails; verify first before building proxy |

---

## Scaling Considerations

This is a single-user SPA. Scaling concerns are about performance at the document level, not infrastructure.

| Concern | At 500 words | At 2000 words | At 5000 words |
|---------|-------------|--------------|--------------|
| LanguageTool API | <5KB payload, fine | <15KB, fine | Approaches 20KB/request limit — may need to split by paragraph |
| Decoration rendering | Negligible | Negligible | ProseMirror DecorationSet is efficient; 100+ decorations are no problem |
| Heuristic computation | <1ms | <5ms | <20ms — use `useMemo` with `essayText` as dep |
| Tiptap onUpdate firing | Fine | Fine | Fine — getText() is O(n) but text editors handle this |

At 5000+ words, batch LanguageTool requests by paragraph and merge results to stay under the 20KB/request limit.

---

## Sources

- [Tiptap React installation](https://tiptap.dev/docs/editor/getting-started/install/react) — package requirements, useEditor hook
- [Tiptap Extension API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension) — addProseMirrorPlugins(), storage, options
- [Tiptap StarterKit extension](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — disabling marks and nodes
- [Tiptap Editor events](https://tiptap.dev/docs/editor/api/events) — onUpdate, onCreate, onBlur
- [Tiptap CharacterCount extension](https://tiptap.dev/docs/editor/extensions/functionality/character-count) — words() and characters() methods
- [Tiptap Discussion: updating decorators from external state](https://github.com/ueberdosis/tiptap/discussions/1012) — transaction metadata pattern
- [ProseMirror DecorationSet in React — Medium](https://medium.com/@faisalmujtaba/prosemirror-decorationset-in-react-everything-i-wish-someone-had-told-me-6262eabae7ca) — decoration architecture
- [LanguageTool Public HTTP API](https://dev.languagetool.org/public-http-api.html) — endpoint, rate limits (20 req/min, 20KB/req)
- [LanguageTool browser addon API client](https://deepwiki.com/languagetool-org/languagetool-browser-addon/5.2-api-client-and-request-handling) — request format (POST, x-www-form-urlencoded)
- Existing codebase: `EssayInput.tsx`, `GradingToolbar.tsx`, `app-store.ts`, `HighlightedEssay.tsx`, `GradingPage.tsx`, `highlight-context.tsx`

---

*Architecture research for: v2.2 Live Essay Feedback — Tiptap + LanguageTool + Heuristics integration*
*Researched: 2026-03-12*
