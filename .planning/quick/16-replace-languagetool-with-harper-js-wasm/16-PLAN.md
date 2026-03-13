---
phase: 16-replace-languagetool-with-harper-js-wasm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/extensions/LanguageTool.ts
  - src/components/grading/LTPopup.tsx
  - src/api/languagetool.ts
  - backend/app/routes/languagetool.py
  - backend/tests/test_languagetool.py
  - backend/app/main.py
  - package.json
autonomous: true
requirements: [QT-16]
must_haves:
  truths:
    - "Grammar errors are detected and underlined within ~300ms of typing pause"
    - "Clicking an underlined word shows popup with message and replacement suggestions"
    - "Selecting a replacement fixes the text in the editor"
    - "No network requests are made for grammar checking"
  artifacts:
    - path: "src/extensions/LanguageTool.ts"
      provides: "Harper.js WASM-based grammar checking via WorkerLinter"
      contains: "WorkerLinter"
    - path: "src/components/grading/LTPopup.tsx"
      provides: "Popup with Harper-compatible category mapping"
  key_links:
    - from: "src/extensions/LanguageTool.ts"
      to: "harper.js WorkerLinter"
      via: "import { WorkerLinter } from 'harper.js'"
      pattern: "WorkerLinter"
    - from: "src/extensions/LanguageTool.ts"
      to: "src/components/grading/LTPopup.tsx"
      via: "data-lt-* decoration attributes"
      pattern: "data-lt-message"
---

<objective>
Replace LanguageTool API-based grammar checking with Harper.js WASM running entirely in-browser via Web Worker. This eliminates network latency (3-5s down to <10ms), removes the backend proxy, and makes grammar checking work offline.

Purpose: Instant grammar feedback without network dependency
Output: Harper.js-powered grammar decorations with same UX as before
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/extensions/LanguageTool.ts
@src/components/grading/LTPopup.tsx
@src/api/languagetool.ts
@backend/app/main.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install harper.js and rewrite LanguageTool extension to use WorkerLinter</name>
  <files>package.json, src/extensions/LanguageTool.ts, src/api/languagetool.ts</files>
  <action>
1. Install harper.js: `npm install harper.js`

2. Rewrite `src/extensions/LanguageTool.ts`:
   - Remove import of `checkText` and `LTMatch` from `@/api/languagetool`
   - Add: `import { WorkerLinter } from 'harper.js'`
   - Create a module-level linter singleton: `const linter = new WorkerLinter()`
   - Keep ALL existing code: `ltPluginKey`, `buildOffsetMap`, `ltOffsetToPmPos`, `snapToWordBounds`, the ProseMirror plugin with its `init/apply/props` (decoration mapping, block-scoped removal, empty doc clearing). Do NOT change any of this.
   - Replace `getCssClass` mapping to handle Harper lint_kind() values:
     - "Spelling" -> "lt-misspelling"
     - "Repetition", "WordChoice", "Capitalization", "Sentence" -> "lt-grammar"
     - "Readability", "Formatting" -> "lt-style"
     - default -> "lt-grammar"
   - Replace `buildDecorations` to accept Harper `Lint[]` instead of `LTMatch[]`:
     - For each lint: `lint.span()` gives `{ start, end }` character offsets (NOT offset+length like LT)
     - Use `snapToWordBounds(text, start, end - start)` for snapping
     - `lint.message()` for data-lt-message
     - `lint.suggestions()` array, map each with `s.get_replacement_text()` for data-lt-replacements
     - `lint.lint_kind()` for CSS class selection
     - data-lt-category: map lint_kind() to lowercase category for popup: "Spelling" -> "spelling", "Repetition" -> "grammar", "WordChoice" -> "grammar", "Capitalization" -> "grammar", "Readability" -> "style", "Formatting" -> "style", default -> "grammar"
     - Keep data-lt-from, data-lt-to, style: cursor:pointer
   - In `onUpdate`, change debounce from 3000 to 300
   - Replace `checkText(text)` call with `linter.lint(text)` (returns Promise<Lint[]>)
   - Pass lint results to updated `buildDecorations`

3. Delete `src/api/languagetool.ts` (the file, not just contents)

Important: The offset mapping logic (buildOffsetMap, ltOffsetToPmPos) stays exactly the same -- Harper uses character offsets into plain text just like LanguageTool did, and we extract text with the same `editor.getText({ blockSeparator: '\n\n' })`.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>LanguageTool.ts uses WorkerLinter from harper.js, debounce is 300ms, languagetool.ts API client is deleted, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Task 2: Update LTPopup category mapping and remove backend LanguageTool code</name>
  <files>src/components/grading/LTPopup.tsx, backend/app/main.py, backend/app/routes/languagetool.py, backend/tests/test_languagetool.py</files>
  <action>
1. Update `src/components/grading/LTPopup.tsx`:
   - Update `getCategoryDotClass` to match new Harper categories stored in data-lt-category:
     - "spelling" -> red dot (bg-red-500)
     - "grammar" -> blue dot (bg-blue-500)
     - "style" -> amber dot (bg-amber-500)
     - default -> blue dot
   - Update `getCategoryLabel` similarly:
     - "spelling" -> "Spelling"
     - "grammar" -> "Grammar"
     - "style" -> "Style"
     - default -> "Grammar"
   - This simplifies the functions since we now normalize categories in the extension. Remove the old multi-value checks (misspelling, typographical, duplication, etc.) and replace with the three normalized values.

2. Remove backend LanguageTool code:
   - Delete `backend/app/routes/languagetool.py`
   - Delete `backend/tests/test_languagetool.py`
   - Edit `backend/app/main.py`: remove `languagetool` from the import line (`from .routes import auth, grading, health, history`) and remove `api_router.include_router(languagetool.router)`

3. Verify no other imports reference the deleted files:
   - Search for "languagetool" in src/ and backend/ to confirm no dangling references
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20 && cd backend && python -c "from app.main import app; print('backend OK')" 2>&1</automated>
  </verify>
  <done>LTPopup uses simplified 3-category mapping, backend has no languagetool references, both frontend and backend compile/import clean</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. `python -c "from app.main import app"` — no import errors
3. Manual: open the app, type text with a spelling error (e.g., "teh"), underline appears within ~500ms, click shows popup with suggestion "the", click suggestion replaces text
4. No network requests to languagetool.org or /api/languagetool visible in browser DevTools Network tab
</verification>

<success_criteria>
- Harper.js WorkerLinter replaces all LanguageTool API calls
- Grammar errors underlined with same CSS classes as before
- Popup shows messages and replacement suggestions from Harper
- Debounce reduced from 3000ms to 300ms
- All LanguageTool backend code removed
- Zero TypeScript compilation errors
- Zero dangling imports
</success_criteria>

<output>
After completion, create `.planning/quick/16-replace-languagetool-with-harper-js-wasm/16-SUMMARY.md`
</output>
