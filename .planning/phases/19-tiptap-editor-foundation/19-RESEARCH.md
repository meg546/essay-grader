# Phase 19: Tiptap Editor Foundation - Research

**Researched:** 2026-03-12
**Domain:** Tiptap v3, React 19, ProseMirror, Zustand state sync, plain text editor
**Confidence:** HIGH

---

## Summary

Phase 19 replaces the existing `<Textarea>`-based `EssayInput` component with a Tiptap v3 headless editor. The replacement must preserve the exact same external contract: `essayText` in Zustand is the single source of truth for plain text, the `EssayInputHandle.triggerFileUpload` ref API stays intact, and the submit flow reads from the store unchanged. Word/character counts update live by reading from the editor on every `onUpdate` event.

The key design is **one-way sync only**: the editor writes plain text to Zustand via `editor.getText()` on `onUpdate`; the store never calls `editor.commands.setContent()` after mount. This avoids the well-documented pitfall where `setContent` clears undo history and creates cursor/focus bugs. The existing `textSize` field already in the store (`TextSize = "small" | "normal" | "large"`) maps directly to Tailwind size classes applied through `editorProps.attributes.class`.

The project uses React 19, Vite (not Next.js/SSR), so `immediatelyRender: false` is a safety belt but not strictly required. It should be set anyway since STATE.md lists it as a confirmed decision.

**Primary recommendation:** Install `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count`, all pinned to `3.20.1`. Configure StarterKit with bold/italic/heading marks disabled. Sync to Zustand in `onUpdate` via `editor.getText({ blockSeparator: '\n\n' })`. Apply text size via `editorProps.attributes.class` derived from the store's `textSize`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | User can type essays in a Tiptap-based plain text editor | useEditor hook with StarterKit (marks disabled), onUpdate → Zustand sync, editorProps Tailwind styling, forwardRef handle for triggerFileUpload |
| EDIT-03 | User can adjust text size (small/normal/large) in the editor | textSize already in app-store.ts; apply TEXT_SIZE_CLASS map via editorProps.attributes.class; toolbar button reads/writes store |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/react | 3.20.1 | React bindings: `useEditor` hook, `EditorContent` component | Official React integration; headless, no CSS opinions |
| @tiptap/pm | 3.20.1 | ProseMirror peer deps | Required sibling; must match @tiptap/react minor |
| @tiptap/starter-kit | 3.20.1 | Bundles Document + Paragraph + Text + History + formatting marks | Avoids manual wiring of required nodes |
| @tiptap/extension-character-count | 3.20.1 | `editor.storage.characterCount.characters()` / `.words()` | Replaces the manual split-on-whitespace in WordStats; live, accurate |

### Version pinning requirement
All `@tiptap/*` packages **must be pinned to the same minor version** (currently `3.20.1`). Mismatched minors produce peer dependency conflicts and silent plugin failures (documented in STATE.md decisions, confirmed in Tiptap GitHub issues).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tiptap/extension-character-count | Manual getText().split() | Extension integrates with ProseMirror transaction cycle; split() in onUpdate is fine but counts differ on edge cases (newlines, Unicode) |
| StarterKit (marks disabled) | Bare Document + Paragraph + Text | StarterKit already ships History (undo/redo) — removing it loses ctrl+Z |

**Installation:**
```bash
npm install @tiptap/react@3.20.1 @tiptap/pm@3.20.1 @tiptap/starter-kit@3.20.1 @tiptap/extension-character-count@3.20.1
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/grading/
│   ├── EssayInput.tsx          # Replace textarea with Tiptap (same file, same exports)
│   ├── EssayInputToolbar.tsx   # New: text size buttons (small/normal/large)
│   └── WordStats.tsx           # Unchanged or reads from editor storage
├── stores/
│   └── app-store.ts            # Already has textSize: TextSize — no changes needed
└── lib/
    └── editor-utils.ts         # Optional: TEXT_SIZE_CLASS map if shared
```

The `EssayInput.tsx` file is replaced in-place. Its public interface (`EssayInputHandle`, `EssayInputProps`) stays identical so `GradingPage.tsx` needs no changes.

### Pattern 1: Plain text Tiptap with one-way Zustand sync

**What:** Editor is uncontrolled after mount. `onUpdate` pushes `editor.getText()` to Zustand. The store never calls back into the editor.

**When to use:** Any scenario where an external consumer reads plain text from a store and does not need to drive the editor's content programmatically after the first mount.

**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/api/events + https://tiptap.dev/docs/editor/core-concepts/persistence
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount } from '@tiptap/extension-character-count'
import { useAppStore } from '@/stores/app-store'

const editor = useEditor({
  immediatelyRender: false,           // Required per STATE.md decision
  extensions: [
    StarterKit.configure({
      bold: false,
      italic: false,
      strike: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      heading: false,
      horizontalRule: false,
      bulletList: false,
      orderedList: false,
    }),
    CharacterCount,
  ],
  content: initialText              // Set once from store on mount
    ? `<p>${initialText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
    : '',
  onUpdate({ editor }) {
    setEssayText(editor.getText({ blockSeparator: '\n\n' }))
  },
})
```

**Critical:** Do NOT call `editor.commands.setContent()` in response to `essayText` Zustand changes. That breaks undo history and causes infinite update loops.

### Pattern 2: Text size via editorProps.attributes.class

**What:** Derive Tailwind text size class from `textSize` store value and inject it into the editor's contenteditable div via `editorProps`.

**When to use:** Any font-size adjustment that must be dynamic without recreating the editor.

**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/style-editor
const TEXT_SIZE_CLASS = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
} as const

// In useEditor config:
editorProps: {
  attributes: {
    class: `outline-none flex-1 overflow-y-auto p-4 leading-relaxed min-h-[250px] ${TEXT_SIZE_CLASS[textSize]}`,
  },
},
```

**Note:** `editorProps` is re-evaluated on options change in Tiptap v3. The editor does NOT need to be destroyed and recreated when `textSize` changes.

### Pattern 3: Preserving the forwardRef / triggerFileUpload handle

**What:** `GradingPage` holds a ref to `EssayInput` to call `essayInputRef.current?.triggerFileUpload()`. The new Tiptap component must expose the same interface.

**When to use:** Whenever a parent triggers file upload via the toolbar's "Upload Essay" button.

**Example:**
```typescript
// React 19 compatible approach — ref as a regular prop (forwardRef deprecated but still works)
// Source: https://react.dev/blog/2024/12/05/react-19
export interface EssayInputHandle {
  triggerFileUpload: () => void
}

// Option A: keep forwardRef (still works in React 19, just deprecated)
export const EssayInput = forwardRef<EssayInputHandle, EssayInputProps>(
  function EssayInput({ disabled }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      triggerFileUpload: () => fileInputRef.current?.click(),
    }))
    // ... editor
  }
)

// Option B: React 19 native ref prop (cleaner, no forwardRef wrapper)
export function EssayInput({ disabled, ref }: EssayInputProps & { ref?: React.Ref<EssayInputHandle> }) {
  // useImperativeHandle works the same way
}
```

Use Option A (forwardRef) for this phase — it keeps the existing interface and avoids TypeScript complexity. React 19 forwardRef support continues unchanged; deprecation is a future concern.

### Anti-Patterns to Avoid

- **Writing store text back to editor:** Never call `editor.commands.setContent(essayText)` in a `useEffect` watching `essayText`. This creates an infinite loop and destroys undo history.
- **Recreating the editor on textSize change:** Don't pass `key={textSize}` to force remount. Use `editorProps` reactivity instead.
- **Using the default StarterKit without disabling marks:** Bold/italic keyboard shortcuts (Ctrl+B, Ctrl+I) will silently apply HTML markup that pollutes `editor.getText()` output when text crosses node boundaries — actually getText() returns plain text regardless, but the document structure drifts from plain text semantics.
- **Stale closure in onUpdate via useEditor config:** The `onUpdate` callback in `useEditor` options can capture stale closures in some Tiptap versions. Safest pattern is to read `setEssayText` from the store reference directly, or use `editor.on('update', handler)` with proper cleanup in `useEffect`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word + character count | Manual split/length in onUpdate | `@tiptap/extension-character-count` | Handles Unicode segmentation, paragraph separators, and node-level counting correctly |
| IME composition handling | Custom compositionstart/end guards | Built into ProseMirror/Tiptap | ProseMirror has battle-tested IME support; custom guards break on Japanese/Chinese/Korean |
| Undo/Redo | Custom history stack | StarterKit History extension | ProseMirror's history is append-only and handles collaborative editing edge cases |
| Plain text serialization | Strip HTML from getHTML() | `editor.getText({ blockSeparator: '\n\n' })` | getText is explicit about paragraph boundaries; HTML stripping misses edge cases |
| Drag-and-drop file detection | DragEvent handlers on EditorContent | Wrap the EditorContent in a div with the same drag handlers from existing EssayInput | Tiptap handles internal drag (node reordering); wrap the outer container for file drops |

**Key insight:** ProseMirror (Tiptap's core) is a production-grade document model used by NYT, Guardian, and Atlassian. Its text handling primitives are significantly more robust than anything hand-rolled against a textarea.

---

## Common Pitfalls

### Pitfall 1: setContent destroys undo history
**What goes wrong:** Calling `editor.commands.setContent(newText)` — even once after mount — adds a history entry. If the user presses Ctrl+Z, the editor returns to empty, and subsequent undos can throw "Invalid content for node doc".
**Why it happens:** setContent creates a ProseMirror transaction that history records like any other edit.
**How to avoid:** Pass initial content through `useEditor({ content: ... })` only. Never call setContent after mount unless intentionally clearing the document (e.g., "Clear" button — use `editor.commands.clearContent()` which also clears history).
**Warning signs:** Undo reverts to empty document on first press.

### Pitfall 2: Version mismatch across @tiptap/* packages
**What goes wrong:** npm resolves `@tiptap/starter-kit@3.20.1` but installs `@tiptap/core@3.19.x` via a loose peer constraint. Extensions that depend on a newer core API fail silently or throw at runtime.
**Why it happens:** Tiptap uses loose `^` semver in peer deps, so npm can pull in older minor versions.
**How to avoid:** Install all packages with exact version `@3.20.1`. Verify with `npm ls @tiptap/core` that only one version is present.
**Warning signs:** TypeScript errors about missing methods, extensions that do nothing.

### Pitfall 3: Stale onUpdate closure captures old setEssayText reference
**What goes wrong:** `setEssayText` from `useAppStore` is destructured once at component mount. If the store identity changes (e.g., due to HMR), the closure calls the old function.
**Why it happens:** Tiptap v2/v3's `useEditor` does not re-subscribe `onUpdate` on re-render.
**How to avoid:** Use `useAppStore.getState().setEssayText` inside onUpdate (accesses live store), or bind via `editor.on('update')` in a `useEffect` that properly re-registers when dependencies change.
**Warning signs:** Essay text in store stops updating after HMR/hot reload in development.

### Pitfall 4: Missing `immediatelyRender: false` with React 19
**What goes wrong:** In strict mode or if Vite ever pre-renders, Tiptap initializes server-side and React throws a hydration mismatch warning.
**Why it happens:** Tiptap v3 added this opt-in after the community reported SSR hydration mismatches.
**How to avoid:** Always set `immediatelyRender: false` — it is listed as a locked decision in STATE.md.
**Warning signs:** Console warning "SSR has been detected, please set immediatelyRender explicitly to false".

### Pitfall 5: Drag-and-drop conflict between Tiptap and file drops
**What goes wrong:** Tiptap intercepts dragover/drop events for internal node DnD. File drops on the editor do nothing or Tiptap throws trying to parse a File object as content.
**Why it happens:** EditorContent attaches ProseMirror's drop handler to the same DOM element.
**How to avoid:** Wrap `EditorContent` in a container `<div>` and attach file drag handlers to the **wrapper**, not to EditorContent. Call `e.stopPropagation()` when a file is detected to prevent Tiptap from processing it. Alternatively use `editorProps.handleDrop` to intercept at the ProseMirror level.
**Warning signs:** Dropped files result in ProseMirror errors in the console.

---

## Code Examples

Verified patterns from official sources:

### Complete EssayInput skeleton with Tiptap
```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/react
//         https://tiptap.dev/docs/editor/api/events
//         https://tiptap.dev/docs/editor/getting-started/style-editor
import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount } from '@tiptap/extension-character-count'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import type { TextSize } from '@/stores/app-store'

const TEXT_SIZE_CLASS: Record<TextSize, string> = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
}

export interface EssayInputHandle {
  triggerFileUpload: () => void
}

export const EssayInput = forwardRef<EssayInputHandle, { disabled?: boolean }>(
  function EssayInput({ disabled }, ref) {
    const textSize = useAppStore((s) => s.textSize)
    const initialText = useAppStore.getState().essayText   // read once — not reactive

    const fileInputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      triggerFileUpload: () => fileInputRef.current?.click(),
    }))

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          bold: false, italic: false, strike: false, code: false,
          codeBlock: false, blockquote: false, heading: false,
          horizontalRule: false, bulletList: false, orderedList: false,
        }),
        CharacterCount,
      ],
      content: initialText
        ? `<p>${initialText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
        : '',
      onUpdate({ editor }) {
        // Use getState() to avoid stale closure on setEssayText
        useAppStore.getState().setEssayText(editor.getText({ blockSeparator: '\n\n' }))
      },
      editorProps: {
        attributes: {
          class: cn(
            'outline-none flex-1 overflow-y-auto p-4 leading-relaxed min-h-[250px] md:min-h-[200px]',
            TEXT_SIZE_CLASS[textSize]
          ),
          'aria-label': 'Essay text',
          'aria-placeholder': 'Paste your essay here or drag and drop a file…',
        },
      },
    })

    // ... drag handlers, file input, EditorContent render
    return (
      <div className={cn('flex-1 flex flex-col min-h-0', disabled && 'opacity-60 pointer-events-none')}>
        <EditorContent editor={editor} className="flex-1 flex flex-col" />
        <input ref={fileInputRef} type="file" accept=".txt,.pdf" className="hidden" />
      </div>
    )
  }
)
```

### Accessing CharacterCount in WordStats
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/functionality/character-count
// Pass editor instance to WordStats, or read from store (words derive from essayText)
const words = editor.storage.characterCount.words()
const characters = editor.storage.characterCount.characters()
```

### Text size selector toolbar button
```typescript
// Reads textSize from store, writes via setTextSize — no editor involvement
const textSize = useAppStore((s) => s.textSize)
const setTextSize = useAppStore((s) => s.setTextSize)

// textSize options: "small" | "normal" | "large"
// Render three buttons; active state = textSize === option
```

### editorProps textSize reactivity
```typescript
// In useEditor — editorProps is an option that can be updated
// Tiptap v3 picks up changes to options without editor recreation
// But the cleanest approach for textSize is to read it inside the class string
// via a selector — the editorProps.attributes.class is re-evaluated each render
const editor = useEditor({
  editorProps: {
    attributes: {
      class: `... ${TEXT_SIZE_CLASS[textSize]}`,  // textSize from outer scope
    },
  },
})
// Note: this requires the component to re-render when textSize changes,
// which happens naturally since useAppStore selector triggers re-render.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tiptap v2 `useEditor` always renders immediately | Tiptap v3 `immediatelyRender: false` opt-in | Tiptap 2.5 / 3.x | Prevents SSR hydration warnings |
| `forwardRef` required for ref props | React 19: `ref` is a standard prop | React 19 (Dec 2024) | `forwardRef` deprecated but still works; no forced migration |
| Manual word count via `getText().split()` | `@tiptap/extension-character-count` with `words()` | Tiptap 2.x | More accurate, handles Unicode |
| Rich text by default | StarterKit mark disable pattern | Always available | Plain text semantics without node pollution |

**Deprecated/outdated:**
- `forwardRef`: Deprecated in React 19. Keep using it for this phase — it still works and the existing codebase uses it.
- Tiptap v2: STATE.md confirms Tiptap v3 is the chosen version. Do not reference v2 docs.

---

## Open Questions

1. **textSize reactivity via editorProps**
   - What we know: `editorProps` options are re-applied in Tiptap v3 when the component re-renders with new values
   - What's unclear: Whether the `class` attribute in `editorProps.attributes` is diffed and patched, or the entire contenteditable DOM attribute is replaced (causing a brief flash)
   - Recommendation: Implement and verify during Phase 19. If flicker occurs, apply textSize class to a wrapper div instead, which is outside Tiptap's DOM management scope.

2. **Paragraph separator in getText()**
   - What we know: `editor.getText({ blockSeparator: '\n\n' })` uses `\n\n` between ProseMirror block nodes (paragraphs)
   - What's unclear: Whether the existing grading backend expects `\n\n` or `\n` between paragraphs — the old textarea had no enforced separator
   - Recommendation: Use `\n\n` as the blockSeparator to match the visual paragraph gap. Verify grading result is identical in Phase 19 success criteria test.

3. **CharacterCount vs WordStats paragraph count**
   - What we know: The existing `WordStats` also counts paragraphs via `split(/\n\s*\n/)`. CharacterCount does not expose paragraph count.
   - What's unclear: Whether to keep WordStats reading from `essayText` store (simple, unchanged) or read from `editor.storage.characterCount`
   - Recommendation: Keep `WordStats` reading from `essayText` in the store. It already works and paragraph counting from the store text is equivalent.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test directories found |
| Config file | None — see Wave 0 |
| Quick run command | `npm run test` (once configured) |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Editor renders and accepts text input | smoke | Playwright or manual verify | ❌ Wave 0 |
| EDIT-01 | getText() returns plain text matching typed content | unit | `vitest run src/components/grading/EssayInput.test.tsx` | ❌ Wave 0 |
| EDIT-01 | Zustand store essayText updates on editor change | unit | `vitest run src/stores/app-store.test.ts` | ❌ Wave 0 |
| EDIT-03 | Text size selector changes editor class immediately | unit | `vitest run src/components/grading/EssayInput.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser smoke test (no automated test infra detected)
- **Per wave merge:** Manual verification of all 4 success criteria from phase spec
- **Phase gate:** All 4 success criteria TRUE before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test infrastructure detected in the project — tests are manual/browser-based
- [ ] If adding Vitest: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`

*(The project has no automated test infrastructure — success criteria are verified manually in the browser)*

---

## Sources

### Primary (HIGH confidence)
- [tiptap.dev/docs/editor/getting-started/install/react](https://tiptap.dev/docs/editor/getting-started/install/react) — React installation, useEditor setup, SSR notes
- [tiptap.dev/docs/editor/api/events](https://tiptap.dev/docs/editor/api/events) — onUpdate callback signature and patterns
- [tiptap.dev/docs/editor/getting-started/style-editor](https://tiptap.dev/docs/editor/getting-started/style-editor) — editorProps.attributes.class, Tailwind CSS patterns
- [tiptap.dev/docs/editor/extensions/functionality/character-count](https://tiptap.dev/docs/editor/extensions/functionality/character-count) — CharacterCount API: words(), characters(), configuration
- [tiptap.dev/docs/editor/extensions/functionality/starterkit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — included extensions, disable-with-false pattern
- [react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19) — forwardRef deprecation in React 19
- GitHub releases ueberdosis/tiptap — confirmed v3.20.1 is latest stable (March 6, 2025)

### Secondary (MEDIUM confidence)
- [github.com/ueberdosis/tiptap/issues/5856](https://github.com/ueberdosis/tiptap/issues/5856) — immediatelyRender: false requirement confirmed by community + Tiptap team
- [github.com/ueberdosis/tiptap/discussions/5708](https://github.com/ueberdosis/tiptap/discussions/5708) — setContent breaks undo history (community confirmed, multiple reports)
- [github.com/ueberdosis/tiptap/discussions/2960](https://github.com/ueberdosis/tiptap/discussions/2960) — Tailwind CSS with Tiptap best practices

### Tertiary (LOW confidence — flagged for validation)
- Version pinning requirement for same minor version: sourced from STATE.md decisions (prior research) and GitHub issue pattern, not official Tiptap docs. Verify by running `npm ls @tiptap/core` after install.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against tiptap.dev official docs and npm
- Architecture: HIGH — onUpdate pattern and editorProps styling verified in official docs
- Pitfalls: HIGH for setContent/undo (multiple GitHub issues), MEDIUM for stale closure (community reports, not officially documented)
- Version pinning: MEDIUM — confirmed as real issue in GitHub issues, not in official docs

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (Tiptap releases frequently; re-check if version beyond 3.20.x is available)
