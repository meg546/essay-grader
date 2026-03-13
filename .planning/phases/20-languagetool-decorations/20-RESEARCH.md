# Phase 20: LanguageTool Decorations - Research

**Researched:** 2026-03-13
**Domain:** ProseMirror decorations, LanguageTool API, Tiptap custom extensions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Color-coded by issue type: red wavy for spelling, blue wavy for grammar, amber wavy for style
- SVG background pattern for the wavy line (not CSS `text-decoration: wavy`) — gives control over wave amplitude/thickness like Grammarly and VS Code
- Uniform opacity for all underline types — no confidence-based dimming
- Underline only, no background tint on flagged text — keeps reading flow clean
- When user types inside or near a decorated word, only that touched decoration clears immediately — other underlines stay
- When a new LanguageTool response arrives, replace entire DecorationSet at once (no diffing or animation)
- Clearing the editor (Clear button) instantly removes all decorations
- No loading indicator while waiting for LanguageTool — decorations just appear when ready
- Rate-limit 429: silent retry with exponential backoff (10s, 20s, 40s). Existing underlines stay visible. No user-facing message.
- Service completely down: silent degradation. No underlines, no error messages. Editor continues working normally.
- No maximum essay length cap — let LanguageTool's own limits handle it
- Try direct browser fetch to LanguageTool API first; if CORS blocks it, automatically fall back to FastAPI backend proxy
- LanguageTool plugin should read from editor state directly, not from Zustand
- `EssayInput.tsx` line 71-107: `useEditor` config — LanguageTool extension added to `extensions` array

### Claude's Discretion
- Exact SVG wave pattern dimensions and rendering approach
- Exponential backoff ceiling and retry count before giving up
- Position mapping implementation details (doc.nodesBetween vs doc.resolve approach)
- Whether to batch-check or send full text on each debounce

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAM-01 | User sees inline underlines for spelling, grammar, and style issues as they type | LanguageTool API returns `offset`/`length`/`issueType` per match; ProseMirror `Decoration.inline()` with CSS SVG background renders wavy underlines; 3s debounce on `onUpdate` triggers API call |
</phase_requirements>

---

## Summary

Phase 20 implements a Tiptap extension that wraps a ProseMirror plugin. The plugin debounces document changes, calls the LanguageTool REST API, maps character offsets from the API response back to ProseMirror absolute positions, and renders `Decoration.inline()` spans with SVG wavy underlines. The two hard problems are: (1) the offset mapping from LanguageTool's flat character count to ProseMirror's tree-position system across paragraph boundaries, and (2) clearing only the touched decoration when the user types (not all decorations).

The LanguageTool public API (`https://api.languagetool.org/v2/check`) confirmed to return `access-control-allow-origin: *`, meaning direct browser fetch works. The FastAPI proxy fallback remains available but may not be needed. A reference open-source implementation (MIT-licensed, sereneinserenade/tiptap-languagetool) was studied in full — it informs the approach without being copied verbatim since it targets Tiptap 2, uses Dexie for an ignore-list feature this phase does not need, and chunks large docs in ways that complicate offset math.

**Primary recommendation:** Build a custom Tiptap extension using `Extension.create` + `addProseMirrorPlugins`. Store `DecorationSet` in plugin state. Use a 3-second `debounce` on `onUpdate`. Send the full document text as a single request. Map LanguageTool offsets to ProseMirror positions by iterating text nodes with `doc.descendants`, accumulating a character-offset-to-PM-position table. Render inline decorations with a CSS class that applies the SVG wavy underline. On each `apply`, if the transaction is doc-changed, find the block node touched by the cursor and clear only the decorations within that block's range; then `decorationSet.map(tr.mapping, tr.doc)` to shift all remaining decorations.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tiptap/core` | 3.20.1 (pinned) | `Extension.create`, type augmentation | Already installed; extension system integrates here |
| `@tiptap/pm` | 3.20.1 (pinned) | Re-exports `prosemirror-state`, `prosemirror-view` | Canonical PM import path for Tiptap 3 projects |
| `prosemirror-state` (via @tiptap/pm) | bundled | `Plugin`, `PluginKey`, `Transaction` | Plugin state machine lives here |
| `prosemirror-view` (via @tiptap/pm) | bundled | `Decoration`, `DecorationSet` | Decoration API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in `fetch` | browser native | LanguageTool API calls | Always — no extra install needed |
| `httpx` | 0.28.1 (already in backend) | FastAPI proxy outbound request | If CORS fails at runtime despite headers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom extension | `tiptap-languagetool` npm package | Package targets Tiptap 2, imports Dexie (ignore-list), adds unnecessary complexity; building custom is 100–150 lines and gives full control |
| Direct `fetch` | Axios | No benefit for a single endpoint; fetch is built-in and sufficient |
| `debounce` from lodash | Custom `setTimeout`/`clearTimeout` | Both work; a 5-line manual debounce avoids adding lodash as dependency |

**No new npm packages needed.** All frontend dependencies are already installed. Backend proxy (if needed) uses httpx already in `pyproject.toml`.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── extensions/
│   └── LanguageTool.ts      # Tiptap extension + ProseMirror plugin (new)
├── api/
│   └── languagetool.ts      # fetch wrapper, CORS fallback, retry logic (new)
└── components/grading/
    └── EssayInput.tsx        # Add LanguageTool extension to extensions array

backend/app/routes/
└── languagetool.py           # POST /api/languagetool/check proxy (new, only if needed)
```

### Pattern 1: ProseMirror Plugin State with External Decoration Updates

The core challenge: decorations are computed asynchronously (from an HTTP request) but ProseMirror state is synchronous. The reference implementation solves this with the `tr.setMeta(pluginKey, decorationSet)` pattern — the async callback dispatches a transaction carrying the new `DecorationSet` as metadata; the plugin `apply` function detects this metadata and returns the new set.

```typescript
// Source: prosemirror.net/docs/ref + sereneinserenade/tiptap-languagetool (MIT)
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const ltPluginKey = new PluginKey<DecorationSet>('languageTool')

export const LanguageToolExtension = Extension.create({
  name: 'languageTool',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ltPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldSet) {
            // Async result arrives via meta
            const newSet = tr.getMeta(ltPluginKey)
            if (newSet !== undefined) return newSet

            // Map existing decorations to new positions after doc change
            if (tr.docChanged) {
              return oldSet.map(tr.mapping, tr.doc)
            }
            return oldSet
          },
        },
        props: {
          decorations(state) {
            return ltPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
```

### Pattern 2: Debounced API Call Dispatching Decoration Metadata

```typescript
// Source: adapted from sereneinserenade/tiptap-languagetool (MIT), prosemirror.net
let debounceTimer: ReturnType<typeof setTimeout>

function scheduleCheck(editor: Editor) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const text = editor.getText({ blockSeparator: '\n\n' })
    if (!text.trim()) {
      // Clear all decorations
      editor.view.dispatch(
        editor.state.tr.setMeta(ltPluginKey, DecorationSet.empty)
      )
      return
    }
    const matches = await checkText(text) // see api/languagetool.ts
    const decorations = buildDecorations(editor.state.doc, text, matches)
    editor.view.dispatch(
      editor.state.tr.setMeta(ltPluginKey, decorations)
    )
  }, 3000)
}
```

### Pattern 3: LanguageTool Offset → ProseMirror Position Mapping

This is the highest-risk part of the implementation. LanguageTool returns `{ offset, length }` as flat character positions in the plain-text string. ProseMirror absolute positions count paragraph-open tokens (+1 per paragraph boundary). A document with two paragraphs "Hello" and "World" has positions:

```
0: doc open
1: <p> open  ← ProseMirror pos 1
2: H
3: e
4: l
5: l
6: o
7: </p>        ← ProseMirror pos 7
8: <p> open
9: W
...
```

The plain-text offset for "World" is 7 (after "Hello\n\n"), but the ProseMirror position is 9. The delta of 2 comes from the extra paragraph boundary tokens.

**The correct mapping algorithm:** Walk `doc.descendants`, collect each text node with its ProseMirror `pos`, and build a lookup that maps flat character positions to PM positions.

```typescript
// Source: prosemirror.net/docs/ref/#model.Node.descendants
function buildOffsetMap(doc: Node): Array<{ charOffset: number; pmPos: number }> {
  const map: Array<{ charOffset: number; pmPos: number }> = []
  let charOffset = 0

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      map.push({ charOffset, pmPos: pos })
      charOffset += node.text.length
    } else if (node.isBlock && map.length > 0) {
      // paragraph separator contributes \n\n to getText output
      // but also costs 2 position tokens in ProseMirror
      // getText({ blockSeparator: '\n\n' }) inserts 2 chars between paragraphs
      charOffset += 2  // account for \n\n separator in the text sent to LT
    }
  })

  return map
}

function ltOffsetToPmPos(
  offset: number,
  map: Array<{ charOffset: number; pmPos: number }>
): number {
  // Find the text node whose charOffset range contains `offset`
  for (let i = map.length - 1; i >= 0; i--) {
    if (map[i].charOffset <= offset) {
      return map[i].pmPos + (offset - map[i].charOffset)
    }
  }
  return offset + 1  // fallback: treat as beginning of doc
}
```

**CRITICAL:** The text sent to LanguageTool MUST match exactly what the offset map was built from. Use `editor.getText({ blockSeparator: '\n\n' })` — and use the same separator when building the offset map. Any mismatch causes off-by-one underlines.

### Pattern 4: Selective Decoration Clear on Typing

When the user types, we must clear only decorations on the touched paragraph, not all decorations (per locked decision).

```typescript
// In plugin.state.apply:
apply(tr, oldSet) {
  const newSet = tr.getMeta(ltPluginKey)
  if (newSet !== undefined) return newSet  // full replacement from API

  if (tr.docChanged) {
    // Find the block node that contains the cursor after the change
    const { from } = tr.selection
    let touchedFrom = from
    let touchedTo = from

    tr.doc.nodesBetween(from, from, (node, pos) => {
      if (node.isBlock) {
        touchedFrom = pos
        touchedTo = pos + node.nodeSize
      }
    })

    // Remove decorations only in the touched block
    const clearedSet = oldSet.remove(oldSet.find(touchedFrom, touchedTo))
    // Map remaining decorations to new positions
    return clearedSet.map(tr.mapping, tr.doc)
  }

  return oldSet
}
```

### Pattern 5: SVG Wavy Underline via CSS

The SVG data URI is embedded as a `background-image` repeating along the x-axis. This approach gives pixel-level control over wave frequency, amplitude, and stroke color — identical to how VS Code and Grammarly render underlines.

```css
/* src/index.css or a component stylesheet */

/* Red wavy — spelling (issueType: misspelling) */
.lt-misspelling {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2.5 Q1.5 0.5 3 2.5 Q4.5 4.5 6 2.5' stroke='%23ef4444' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: bottom left;
  background-size: 6px 3px;
  padding-bottom: 2px;
}

/* Blue wavy — grammar */
.lt-grammar {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2.5 Q1.5 0.5 3 2.5 Q4.5 4.5 6 2.5' stroke='%233b82f6' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: bottom left;
  background-size: 6px 3px;
  padding-bottom: 2px;
}

/* Amber wavy — style */
.lt-style {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2.5 Q1.5 0.5 3 2.5 Q4.5 4.5 6 2.5' stroke='%23f59e0b' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: bottom left;
  background-size: 6px 3px;
  padding-bottom: 2px;
}
```

The decoration inline class names must match: `lt-misspelling`, `lt-grammar`, `lt-style`. LanguageTool `issueType` values that map to each bucket:

| LanguageTool issueType | Color | CSS class |
|------------------------|-------|-----------|
| `misspelling`, `typographical` | red | `lt-misspelling` |
| `grammar`, `duplication`, `inconsistency` | blue | `lt-grammar` |
| `style`, `locale-violation`, `register`, `formatting` | amber | `lt-style` |
| All others | blue (grammar default) | `lt-grammar` |

### Pattern 6: API Layer with CORS Fallback and Retry

```typescript
// src/api/languagetool.ts
const LT_PUBLIC = 'https://api.languagetool.org/v2/check'
const LT_PROXY = '/api/languagetool/check'  // FastAPI fallback

export interface LTMatch {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: Array<{ value: string }>
  rule: {
    id: string
    issueType: string
    category: { id: string; name: string }
  }
}

export interface LTResponse {
  matches: LTMatch[]
}

export async function checkText(
  text: string,
  retryCount = 0
): Promise<LTMatch[]> {
  const body = new URLSearchParams({
    text,
    language: 'auto',
    level: 'picky',
  })

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  }

  try {
    const url = retryCount === 0 ? LT_PUBLIC : LT_PROXY
    const res = await fetch(url, { method: 'POST', headers, body })

    if (res.status === 429) {
      // Exponential backoff: 10s, 20s, 40s (3 retries max)
      if (retryCount < 3) {
        const delay = 10_000 * Math.pow(2, retryCount)
        await new Promise((r) => setTimeout(r, delay))
        return checkText(text, retryCount + 1)
      }
      return []  // give up — existing decorations remain
    }

    if (!res.ok) return []

    const data: LTResponse = await res.json()
    return data.matches
  } catch {
    // Network error or CORS on direct: try proxy once
    if (retryCount === 0) return checkText(text, 1)
    return []  // silent degradation
  }
}
```

**CORS is confirmed working:** `curl -I https://api.languagetool.org/v2/check` returns `access-control-allow-origin: *`. Direct fetch will work in the browser. The proxy route still needs to be built as fallback (it costs ~20 lines of FastAPI).

### Pattern 7: FastAPI Proxy Route (fallback)

```python
# backend/app/routes/languagetool.py
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import httpx

router = APIRouter(tags=["languagetool"])
LT_API = "https://api.languagetool.org/v2/check"

@router.post("/languagetool/check")
async def proxy_languagetool(request: Request):
    body = await request.body()
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                LT_API,
                content=body,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=15.0,
            )
            return JSONResponse(status_code=res.status_code, content=res.json())
        except Exception:
            return JSONResponse(status_code=503, content={"matches": []})
```

Register in `main.py`: `api_router.include_router(languagetool.router)`

### Anti-Patterns to Avoid
- **Reading from Zustand in the extension:** The LanguageTool plugin must read `editor.state` / `editor.getText()` directly. Zustand has the text but as a one-way sync target, not a source of truth.
- **Storing DecorationSet in React state:** Decoration state must live in ProseMirror plugin state (confirmed in STATE.md). React state causes re-renders that reset cursor position.
- **Using `text-decoration: wavy` CSS:** No control over color per issue type in older browsers; SVG background-image is cross-browser and matches the locked decision.
- **Rebuilding DecorationSet from scratch on every keypress:** Expensive. Use `decorationSet.map(tr.mapping, tr.doc)` to shift existing decorations, only rebuilding after an API response arrives.
- **Sending per-keystroke API requests:** Will hit the 20 req/min rate limit immediately. Enforce the 3-second debounce strictly.
- **Using `editor.getHTML()` as the text input to LanguageTool:** HTML tags inflate the character offsets. Always use `editor.getText({ blockSeparator: '\n\n' })`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decoration position tracking across edits | Custom position re-calculation | `decorationSet.map(tr.mapping, tr.doc)` | PM mapping handles all insertion/deletion edge cases including multi-byte characters |
| Wavy underline rendering | Canvas drawing, custom DOM insertion | CSS `background-image` with SVG data URI | Browser renders natively; zero JS at paint time |
| Debounce | Custom class | Single `setTimeout`/`clearTimeout` pair (5 lines) | Simpler than lodash for single use; lodash not in project |
| API retry delay | Custom retry scheduler | `await new Promise(r => setTimeout(r, delay))` inline | Simple exponential backoff needs no library |

---

## Common Pitfalls

### Pitfall 1: Off-by-One Errors in Position Mapping
**What goes wrong:** Underlines appear one character off, or span the wrong word, especially at paragraph boundaries.
**Why it happens:** LanguageTool offset is a flat character count; ProseMirror positions count opening/closing node tokens. Each paragraph boundary costs 2 extra position units in ProseMirror (one for close, one for open) but only contributes 2 characters (`\n\n`) in the flat text.
**How to avoid:** Build the offset map by walking `doc.descendants` and tracking both the plain-text character accumulator and the PM `pos`. The `blockSeparator` passed to `editor.getText()` MUST match what the offset map assumes paragraph boundaries cost in characters.
**Warning signs:** Underlines that highlight the character after the flagged word, or that miss the first character of a word that starts a new paragraph.

### Pitfall 2: Decoration Flicker on Every Keypress
**What goes wrong:** All underlines disappear while the user types, then reappear 3 seconds later. The experience feels broken.
**Why it happens:** If the `apply` function returns `DecorationSet.empty` on every `tr.docChanged`, all decorations clear immediately.
**How to avoid:** In `apply`, only clear decorations in the touched block (the paragraph where the cursor is). Keep all other paragraph decorations by calling `decorationSet.map(tr.mapping, tr.doc)` on the remainder.
**Warning signs:** Decorations flash off/on with every keystroke.

### Pitfall 3: Stale Editor Reference in Async Callback
**What goes wrong:** The decoration dispatch uses a stale `editorView` reference. The view has been destroyed or replaced.
**Why it happens:** Closures in async callbacks capture the view at creation time.
**How to avoid:** Capture `editor.view` fresh inside the debounced callback using `editor.view` (the editor object is stable; the `view` property always points to the current view). Check `editor.isDestroyed` before dispatching.
**Warning signs:** Console errors about dispatching to a destroyed view.

### Pitfall 4: CORS Fallback Loop
**What goes wrong:** The proxy also fails, causing an infinite retry loop.
**Why it happens:** The retry logic falls back to the proxy on any fetch failure, but if the proxy is also down, it retries again.
**How to avoid:** Track which URL was last tried. Only fall back from `LT_PUBLIC` to `LT_PROXY` once. Rate-limit retries to 3 total. Always return `[]` after exhausting retries.
**Warning signs:** Network tab shows repeated requests every few seconds with no end.

### Pitfall 5: Rate Limit Reached Immediately in Development
**What goes wrong:** The 20 requests/minute limit is hit during testing because saving triggers re-renders that re-mount the editor and call proofread on mount.
**Why it happens:** HMR replaces the component, unmounting and remounting, which fires the initial check.
**How to avoid:** Only trigger the initial check after a 3-second debounce — not immediately on extension mount. Do not call proofread in the extension's `init`. Trigger it from `onUpdate` only.
**Warning signs:** 429 errors appearing in the first few seconds of development.

### Pitfall 6: Clear Button Does Not Remove Decorations
**What goes wrong:** After clicking Clear, the editor text is gone but the underline decorations remain (as phantom marks on the now-empty document).
**Why it happens:** The Clear button calls `editor.commands.clearContent()`, which dispatches a `setContent('')` transaction. If the `apply` function only calls `.map()`, the decorations are "mapped" to positions that no longer exist in the empty document but may not be removed.
**How to avoid:** In `apply`, after mapping, check if the mapped set still has decorations but the doc is empty. Alternatively, detect an empty document and return `DecorationSet.empty`. The debounce will also fire 3 seconds later, call LanguageTool with empty text, and dispatch `DecorationSet.empty` anyway — but clearing immediately is preferred.

---

## Code Examples

### LanguageTool API Request

```typescript
// Confirmed working via curl test 2026-03-13
const body = new URLSearchParams({
  text: 'This is an test.',
  language: 'auto',
})

const res = await fetch('https://api.languagetool.org/v2/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})
// Response: { matches: [{ offset: 8, length: 8, rule: { issueType: 'misspelling' }, ... }] }
```

### Confirmed API Response Structure

```json
{
  "matches": [
    {
      "message": "Use 'a' instead of 'an'.",
      "shortMessage": "Wrong article",
      "offset": 8,
      "length": 2,
      "replacements": [{"value": "a"}],
      "rule": {
        "id": "EN_A_VS_AN",
        "issueType": "misspelling",
        "category": { "id": "TYPOS", "name": "Possible Typo" }
      }
    }
  ]
}
```

### Adding Extension to EssayInput

```typescript
// src/components/grading/EssayInput.tsx — add to extensions array
import { LanguageToolExtension } from '@/extensions/LanguageTool'

const editor = useEditor({
  immediatelyRender: false,
  extensions: [
    StarterKit.configure({ /* existing config */ }),
    CharacterCount,
    LanguageToolExtension,  // ADD THIS
  ],
  // ... rest unchanged
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `text-decoration: wavy` for grammar underlines | SVG `background-image` data URI | ~2020 (Grammarly/VS Code adoption) | Full color control, consistent rendering across browsers |
| Tiptap 2 decoration via `addProseMirrorPlugins` | Tiptap 3 native Decorations API | Tiptap v3.0 (2024) | v3 adds a higher-level decoration API, but `addProseMirrorPlugins` still works and is more explicit for complex async use cases |
| Per-change API requests | Debounced batch requests | Best practice since early grammar checkers | Required to avoid 429s on LanguageTool's 20 req/min limit |

**Deprecated/outdated:**
- `prosemirror-state` direct import: In Tiptap 3 projects, use `@tiptap/pm/state` instead — same module, re-exported to guarantee version alignment.
- `import { Plugin } from 'prosemirror-state'`: Use `import { Plugin } from '@tiptap/pm/state'` — avoids duplicate ProseMirror instances.

---

## Open Questions

1. **Does `level: 'picky'` improve underline quality enough to justify more matches?**
   - What we know: LanguageTool `level` param accepts `default` or `picky`. `picky` returns more style suggestions.
   - What's unclear: Whether picky produces too much noise for student writing.
   - Recommendation: Start with `level: default` (omit the param — it defaults to `default`). Can tune in Phase 22 when the toggle is added.

2. **Should paragraph separators be `\n\n`, `\n`, or a space when building the text sent to LanguageTool?**
   - What we know: `editor.getText({ blockSeparator: '\n\n' })` is the existing pattern in the codebase. LanguageTool handles newlines naturally.
   - What's unclear: Whether `\n\n` vs `\n` affects sentence boundary detection in LanguageTool.
   - Recommendation: Use `\n\n` to match the existing store pattern. Build the offset map with the same separator. Validate with a two-paragraph integration test.

3. **CORS in production build (not dev server)?**
   - What we know: `access-control-allow-origin: *` confirmed on the LanguageTool API. Dev works fine.
   - What's unclear: Whether there are any `origin`-based restrictions for non-browser user agents.
   - Recommendation: Test in production build; the FastAPI proxy fallback exists as insurance.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0+ (backend) |
| Config file | `backend/pyproject.toml` — `[tool.pytest.ini_options]` with `asyncio_mode = "auto"` |
| Quick run command | `cd backend && python -m pytest tests/test_languagetool.py -x` |
| Full suite command | `cd backend && python -m pytest` |

Frontend has no unit test framework installed. Browser-observable behaviors (underline appearance, timing) are integration-tested manually during verification.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAM-01 | Backend proxy route returns LanguageTool JSON | unit | `cd backend && python -m pytest tests/test_languagetool.py -x` | ❌ Wave 0 |
| GRAM-01 | Offset-to-PM-position mapping for multi-paragraph text | unit | `cd backend && python -m pytest tests/test_languagetool.py::test_offset_mapping -x` | ❌ Wave 0 |
| GRAM-01 | 429 retry logic (mock fetch) | manual | — | manual-only (browser fetch, no frontend test runner) |
| GRAM-01 | Decorations appear within 4s after typing stops | manual | — | manual-only |
| GRAM-01 | Decorations clear on typing within touched paragraph | manual | — | manual-only |

**Note:** The position mapping logic lives in the frontend TypeScript extension. Since there is no frontend test runner, the mapping algorithm should be validated through a standalone Node script during development, or via the backend proxy test if the mapping is extracted to a pure utility.

### Sampling Rate
- **Per task commit:** `cd backend && python -m pytest tests/test_languagetool.py -x`
- **Per wave merge:** `cd backend && python -m pytest`
- **Phase gate:** Backend proxy tests green + manual browser verification of all 4 GRAM-01 success criteria

### Wave 0 Gaps
- [ ] `backend/tests/test_languagetool.py` — covers proxy route + 429 handling
- [ ] Frontend offset mapping: validated manually via browser console during implementation (no frontend test runner exists — not a Wave 0 gap to fix in this phase)

---

## Sources

### Primary (HIGH confidence)
- LanguageTool public API (`curl -I https://api.languagetool.org/v2/check`) — CORS `*` header confirmed 2026-03-13
- `https://languagetool.org/http-api/languagetool-swagger.json` — full request/response schema
- `https://prosemirror.net/docs/ref/` — position system, `doc.descendants`, `DecorationSet.map`
- `@tiptap/pm` package in project (`package.json`) — confirms the import path for ProseMirror in this Tiptap 3 project
- Existing `EssayInput.tsx` — confirmed editor setup, `immediatelyRender: false`, `onUpdate` closure pattern

### Secondary (MEDIUM confidence)
- `https://github.com/sereneinserenade/tiptap-languagetool` (MIT) — full source read via raw GitHub; targets Tiptap 2 but core Plugin/DecorationSet patterns are ProseMirror-level and version-stable
- `https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension` — `addProseMirrorPlugins` API confirmed for v3

### Tertiary (LOW confidence)
- SVG wavy underline wave dimensions (6px × 3px, Q curve) — synthesized from CodePen examples; exact values should be tuned visually during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, no new dependencies
- Architecture: HIGH — ProseMirror plugin pattern verified against reference implementation and official docs
- LanguageTool API: HIGH — endpoint, schema, and CORS confirmed via live curl
- Position mapping: MEDIUM — documented approach is correct in principle; off-by-one risk remains (validate with two-paragraph integration test)
- SVG wave dimensions: LOW — aesthetic values need visual tuning

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (LanguageTool API and Tiptap 3 are stable; position mapping logic is fundamental PM behavior unlikely to change)
