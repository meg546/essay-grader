# Phase 2: Essay Input & Rubric Editor - Research

**Researched:** 2026-03-08
**Domain:** React form inputs, PDF text extraction, Zustand state management
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Word and character counts displayed below the textarea as small text (e.g., "245 words · 1,432 characters")
- No word count limits or warnings -- just display the count, the AI grades whatever is submitted
- Counts update live as user types or pastes
- Drag and drop files directly onto the textarea itself (not a separate dedicated drop zone) -- needs visual feedback on drag-over
- Toast notification for unsupported file types: "Only .txt and .pdf files are supported"
- Supported formats: .txt and .pdf only

### Claude's Discretion
- Textarea height (fixed vs auto-grow) and labeling/heading text
- File upload zone placement relative to textarea (above, tabs, or below)
- How extracted PDF text is previewed (fill textarea directly vs separate preview panel)
- Two-column ratio (50/50 vs 60/40 vs other)
- Mobile stack order (essay first vs rubric first)
- Submit button visibility (always visible but disabled vs conditional)
- Whether columns use card containers or open layout
- Rubric editor interaction patterns (inline editing, add/remove buttons, reset confirmation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPT-01 | User can paste essay text into a large textarea | shadcn Textarea component, standard controlled input pattern |
| INPT-02 | User can see word and character count update as they type/paste | Derived computation from essay text state in Zustand store |
| INPT-03 | User can upload essay via .txt or .pdf file (drag-and-drop or click) | Native HTML5 drag-and-drop events on textarea wrapper + pdfjs-dist for PDF extraction |
| INPT-04 | User can see extracted text preview after uploading a PDF | pdfjs-dist getDocument/getTextContent pattern, fill textarea directly |
| RUBR-01 | User sees default ASAP rubric (Content & Ideas, Organization, Style/Voice, Language Conventions) on 0-6 scales | ASAP default constant + Zustand rubric slice |
| RUBR-02 | User can rename rubric categories | Inline editable input fields in rubric editor |
| RUBR-03 | User can add and remove rubric categories | Array manipulation actions in Zustand store |
| RUBR-04 | User can adjust max score per category | Number input or stepper in rubric editor rows |
| RUBR-05 | User can reset rubric to default ASAP categories | Reset action restoring ASAP default constant |
</phase_requirements>

## Summary

This phase builds the complete input experience for the grading page: an essay textarea with live word/character counts, file upload (`.txt` and `.pdf`) with drag-and-drop onto the textarea, and a fully editable rubric editor with ASAP defaults. The existing `GradingPage.tsx` skeleton will be replaced with real components, and the existing Zustand store will be extended with essay and rubric state slices.

The technical complexity centers on three areas: (1) PDF text extraction using `pdfjs-dist` with its Vite worker configuration, (2) native HTML5 drag-and-drop events applied to the textarea wrapper, and (3) extending the Zustand store to hold essay text and rubric categories that persist across navigation. All other aspects are standard React form patterns using shadcn/ui components.

**Primary recommendation:** Use `pdfjs-dist` (v5.x) for PDF text extraction with the `new URL(import.meta.url)` worker pattern for Vite compatibility. Extend the existing Zustand store with essay and rubric state. Use native HTML5 drag-and-drop (no library needed). Install shadcn Textarea, Input, and Label components.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdfjs-dist | ^5.5 | PDF text extraction | Mozilla's official PDF.js, only mature option for client-side PDF text extraction |
| zustand | ^5.0.11 | State management (already installed) | Already in use, extend existing store |
| shadcn/ui components | v4 (already installed) | Textarea, Input, Label, Card UI | Already established as the project's component library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 (installed) | Icons for upload, add, remove, reset buttons | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdfjs-dist | unpdf | unpdf is newer/lighter but less proven in browser; pdfjs-dist is battle-tested |
| Native drag-and-drop | react-dropzone | react-dropzone adds dependency for simple use case; native API is sufficient for textarea overlay |

**Installation:**
```bash
npm install pdfjs-dist
npx shadcn@latest add textarea input label card
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── grading/
│   │   ├── EssayInput.tsx        # Textarea + drag-drop + file upload + counts
│   │   ├── RubricEditor.tsx      # Rubric category list + add/remove/reset
│   │   └── RubricCategoryRow.tsx  # Single editable rubric row
│   └── ui/                       # shadcn components (existing)
├── stores/
│   └── app-store.ts              # Extended with essay + rubric state
├── lib/
│   └── pdf-extract.ts            # PDF text extraction utility
├── pages/
│   └── GradingPage.tsx           # Composes EssayInput + RubricEditor
└── api/
    └── types.ts                  # RubricCategory already defined here
```

### Pattern 1: Extended Zustand Store with Essay and Rubric State
**What:** Add essay text and rubric categories to the existing Zustand store, keeping the flat store approach (no slices needed for this scale).
**When to use:** The existing store is small (5 properties). Adding essay/rubric state keeps it under 15 properties, well within flat store territory.
**Example:**
```typescript
// Extend existing AppState interface
interface AppState {
  // Existing
  currentResult: GradingResult | null;
  history: GradingResult[];
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;

  // Essay input state
  essayText: string;
  setEssayText: (text: string) => void;

  // Rubric state
  rubricCategories: RubricCategory[];
  setRubricCategories: (categories: RubricCategory[]) => void;
  updateCategory: (index: number, updates: Partial<RubricCategory>) => void;
  addCategory: () => void;
  removeCategory: (index: number) => void;
  resetRubric: () => void;
}
```

### Pattern 2: ASAP Default Rubric as a Constant
**What:** Define the ASAP rubric defaults as a named constant, used for initial state and reset.
**Example:**
```typescript
// In a constants file or at top of store
export const ASAP_DEFAULT_RUBRIC: RubricCategory[] = [
  { name: "Content & Ideas", maxScore: 6 },
  { name: "Organization", maxScore: 6 },
  { name: "Style/Voice", maxScore: 6 },
  { name: "Language Conventions", maxScore: 6 },
];
```

### Pattern 3: Native HTML5 Drag-and-Drop on Textarea Wrapper
**What:** Wrap the textarea in a div that handles dragover/dragleave/drop events. Use state to toggle visual feedback.
**Example:**
```typescript
const [isDragOver, setIsDragOver] = useState(false);

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
};

const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  const file = e.dataTransfer.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "txt" && ext !== "pdf") {
    // Show toast: "Only .txt and .pdf files are supported"
    return;
  }

  if (ext === "txt") {
    const text = await file.text();
    setEssayText(text);
  } else {
    const text = await extractTextFromPdf(file);
    setEssayText(text);
  }
};
```

### Pattern 4: PDF Text Extraction Utility
**What:** Isolated async function that takes a File and returns extracted text string.
**Example:**
```typescript
// src/lib/pdf-extract.ts
import * as pdfjsLib from "pdfjs-dist";

// Vite-compatible worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str: string }) => item.str)
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}
```

### Pattern 5: Derived Word/Character Counts
**What:** Compute counts from essay text rather than storing them separately.
**Example:**
```typescript
// In component, derive from store state
const essayText = useAppStore((s) => s.essayText);
const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
const charCount = essayText.length;
// Display: "245 words · 1,432 characters"
```

### Anti-Patterns to Avoid
- **Storing derived state:** Do NOT store word/character counts in the store. Derive them from essayText in the component.
- **Separate drop zone component:** User explicitly wants drag-and-drop ON the textarea, not a separate upload area.
- **Over-engineering rubric state:** The RubricCategory type already exists in types.ts. Reuse it, don't create a parallel type.
- **Using FileReader API:** Modern browsers support `file.arrayBuffer()` and `file.text()` directly -- no need for the older FileReader callback pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | pdfjs-dist | PDF is a complex binary format with fonts, encodings, compression |
| Toast notifications | Custom notification system | shadcn Sonner or simple toast | Need it for "unsupported file type" -- install shadcn sonner |
| Textarea component | Custom textarea with styles | shadcn Textarea | Consistent styling with existing UI components |
| Form input styling | Manual Tailwind on raw inputs | shadcn Input + Label | Accessibility and consistency |

**Key insight:** PDF parsing is genuinely complex. Everything else in this phase is standard React form handling -- keep it simple.

## Common Pitfalls

### Pitfall 1: pdfjs-dist Worker Path in Vite
**What goes wrong:** PDF extraction fails silently or throws worker errors because Vite cannot resolve the pdf.js worker file.
**Why it happens:** pdfjs-dist v4+ changed worker bundling. Direct imports no longer work. Vite's module resolution differs from webpack.
**How to avoid:** Use the `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()` pattern. Set it at module level BEFORE any getDocument calls. Test with an actual PDF file early.
**Warning signs:** Console errors about worker, PDF loading hangs indefinitely, or "Setting up fake worker" messages.

### Pitfall 2: DragLeave Fires on Child Elements
**What goes wrong:** Visual drag-over feedback flickers as cursor moves over child elements within the drop zone.
**Why it happens:** `dragleave` fires when entering a child element. The textarea itself is a child of the drop zone wrapper.
**How to avoid:** Use a counter-based approach or check `e.currentTarget.contains(e.relatedTarget)` in the dragleave handler. Alternatively, use `pointer-events-none` on the textarea overlay during drag.
**Warning signs:** Drag overlay flickers on/off rapidly.

### Pitfall 3: Rubric State Reset Creates Shared Reference
**What goes wrong:** After reset, editing one category mutates the default constant.
**Why it happens:** Resetting rubric by assigning the default array directly shares the reference.
**How to avoid:** Always spread/deep-copy the default: `ASAP_DEFAULT_RUBRIC.map(c => ({ ...c }))`.
**Warning signs:** Default rubric appears corrupted after editing post-reset.

### Pitfall 4: Empty String Word Count
**What goes wrong:** Empty textarea shows "1 word" instead of "0 words".
**Why it happens:** `"".split(/\s+/)` returns `[""]` which has length 1.
**How to avoid:** Guard with `text.trim() ? text.trim().split(/\s+/).length : 0`.
**Warning signs:** Word count shows 1 when textarea is empty.

### Pitfall 5: PDF Files Without Extractable Text
**What goes wrong:** PDF extraction returns empty string for scanned/image-based PDFs.
**Why it happens:** pdfjs-dist extracts text layer only, not OCR.
**How to avoid:** Check if extracted text is empty/very short and show a user-friendly message: "Could not extract text from this PDF. Try pasting the text directly."
**Warning signs:** Empty textarea after uploading a seemingly valid PDF.

## Code Examples

### Toast for Unsupported File Types
```typescript
// Install: npx shadcn@latest add sonner
// Add <Toaster /> to App.tsx layout
import { toast } from "sonner";

// In drop handler:
if (ext !== "txt" && ext !== "pdf") {
  toast.error("Only .txt and .pdf files are supported");
  return;
}
```

### Rubric Category Row (Editable)
```typescript
function RubricCategoryRow({
  category,
  index,
  onUpdate,
  onRemove,
}: {
  category: RubricCategory;
  index: number;
  onUpdate: (index: number, updates: Partial<RubricCategory>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Input
        value={category.name}
        onChange={(e) => onUpdate(index, { name: e.target.value })}
        className="flex-1"
      />
      <Input
        type="number"
        value={category.maxScore}
        onChange={(e) => onUpdate(index, { maxScore: Number(e.target.value) })}
        className="w-20"
        min={1}
        max={100}
      />
      <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### File Input (Click to Upload)
```typescript
// Hidden file input triggered by a button
const fileInputRef = useRef<HTMLInputElement>(null);

<input
  ref={fileInputRef}
  type="file"
  accept=".txt,.pdf"
  className="hidden"
  onChange={handleFileSelect}
/>
<Button
  variant="outline"
  onClick={() => fileInputRef.current?.click()}
>
  <Upload className="h-4 w-4 mr-2" />
  Upload File
</Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FileReader API callbacks | `file.arrayBuffer()` / `file.text()` promises | Broadly supported since 2020+ | Cleaner async code, no callback nesting |
| pdfjs-dist v3 direct worker import | `new URL(import.meta.url)` pattern | pdfjs-dist v4 (2024) | Must use URL constructor for Vite/ESM compatibility |
| Zustand v4 `create<T>()(...)` | Zustand v5 same pattern, improved TS inference | 2024 | Minimal API change, better types |

**Deprecated/outdated:**
- `FileReader` for reading file contents: Use `file.text()` and `file.arrayBuffer()` instead
- `pdfjs-dist/build/pdf.worker.js` (non-ESM): Use `pdf.worker.min.mjs` (ESM) with Vite

## Discretion Recommendations

Based on research, here are recommendations for areas left to Claude's discretion:

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Textarea height | Fixed height (h-64 / 16rem) with overflow-y-auto | Predictable layout; auto-grow causes layout shifts |
| File upload placement | Small upload button below textarea, before counts | Clean -- button acts as alternative to drag-drop |
| PDF preview | Fill textarea directly | Simpler; user can see/edit extracted text immediately |
| Two-column ratio | 1fr 1fr (equal columns) | Matches existing skeleton; both sides need equal space |
| Mobile stack order | Essay first, rubric second | Natural top-to-bottom flow: write then configure |
| Submit button | Always visible, disabled when essay is empty | Users can always see the CTA; disabled state communicates requirement |
| Column containers | Card containers with padding | Visual separation; consistent with education-focused design |
| Rubric interactions | Inline editing with icon buttons for remove; "Add Category" and "Reset to Defaults" as text buttons below | Simple, standard pattern |

## Open Questions

1. **pdfjs-dist v5 + Vite 7 worker path**
   - What we know: The `new URL(import.meta.url)` pattern works for pdfjs-dist v4+ with Vite. Version 5.5.x is current.
   - What's unclear: Whether Vite 7 (project uses ^7.3.1) introduces any breaking changes to this pattern.
   - Recommendation: Implement and test early. If worker fails, fall back to CDN-hosted worker as escape hatch: `pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.5.207/pdf.worker.min.mjs"`.

2. **Sonner/Toast component**
   - What we know: shadcn provides a Sonner integration for toasts. The user decision requires a toast for unsupported file types.
   - What's unclear: Whether Sonner is already available or needs installation.
   - Recommendation: Install `npx shadcn@latest add sonner` and add `<Toaster />` to the app layout.

## Sources

### Primary (HIGH confidence)
- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist) - version 5.5.207 confirmed current
- [mozilla/pdf.js Discussion #19520](https://github.com/mozilla/pdf.js/discussions/19520) - Vite worker configuration pattern
- [Zustand Slices Pattern DeepWiki](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern) - store organization patterns

### Secondary (MEDIUM confidence)
- [PDF text extraction with pdfjs-dist](https://iamvkr.in/posts/extract-text-from-pdf-react/) - getDocument/getTextContent pattern verified
- [Native drag-drop in React](https://dev.to/hexshift/implementing-drag-drop-file-uploads-in-react-without-external-libraries-1d31) - HTML5 drag-and-drop event patterns
- [shadcn Textarea docs](https://ui.shadcn.com/docs/components/radix/textarea) - component API

### Tertiary (LOW confidence)
- pdfjs-dist v5.x + Vite 7 specific compatibility -- needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pdfjs-dist is the only real option for client-side PDF text extraction; all other libraries are wrappers around it
- Architecture: HIGH - extending existing Zustand store is straightforward; component structure follows established project patterns
- Pitfalls: HIGH - well-documented issues with pdfjs-dist workers, drag-leave flickering, and word count edge cases

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- stable domain, pdfjs-dist version may update but API is stable)
