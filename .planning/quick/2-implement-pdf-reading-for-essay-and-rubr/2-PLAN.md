---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/app-store.ts
  - src/api/types.ts
  - src/api/grading.ts
  - src/components/grading/RubricUpload.tsx
  - src/pages/GradingPage.tsx
autonomous: true
requirements: [QUICK-2]

must_haves:
  truths:
    - "Uploading a rubric PDF extracts its text and stores it"
    - "User can see a preview of extracted rubric text confirming it was read"
    - "Clearing rubric clears both file reference and extracted text"
    - "Mock grading API receives rubric text and reflects it in response"
  artifacts:
    - path: "src/stores/app-store.ts"
      provides: "rubricText state field alongside rubricFile"
    - path: "src/components/grading/RubricUpload.tsx"
      provides: "PDF text extraction on upload + text preview"
    - path: "src/api/grading.ts"
      provides: "Mock API uses rubricText in response"
  key_links:
    - from: "src/components/grading/RubricUpload.tsx"
      to: "src/lib/pdf-extract.ts"
      via: "extractTextFromPdf call on file upload"
      pattern: "extractTextFromPdf"
    - from: "src/components/grading/RubricUpload.tsx"
      to: "src/stores/app-store.ts"
      via: "setRubricText after extraction"
      pattern: "setRubricText"
    - from: "src/pages/GradingPage.tsx"
      to: "src/api/grading.ts"
      via: "passes rubricText in gradeEssay request"
      pattern: "rubricText"
---

<objective>
Wire up rubric PDF text extraction so uploaded rubrics are actually parsed and their content flows through the system. Currently rubric uploads store only the raw File object with no text extraction -- the content is never read or used.

Purpose: Close the gap where rubric uploads are cosmetic-only, making the rubric content available for grading.
Output: Working rubric PDF extraction with text preview and mock API integration.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/stores/app-store.ts
@src/api/types.ts
@src/api/grading.ts
@src/lib/pdf-extract.ts
@src/components/grading/RubricUpload.tsx
@src/pages/GradingPage.tsx

<interfaces>
From src/lib/pdf-extract.ts:
```typescript
export async function extractTextFromPdf(file: File): Promise<string>;
```

From src/stores/app-store.ts:
```typescript
interface AppState {
  essayText: string;
  rubricFile: File | null;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  // ... other fields
}
```

From src/api/types.ts:
```typescript
export interface GradeEssayRequest {
  essayText: string;
  rubricFile?: File;
  gradeLevel: string;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add rubricText to store and update API types</name>
  <files>src/stores/app-store.ts, src/api/types.ts, src/api/grading.ts, src/pages/GradingPage.tsx</files>
  <action>
1. In `src/stores/app-store.ts`:
   - Add `rubricText: string` to AppState interface (default `""`)
   - Add `setRubricText: (text: string) => void` to AppState interface
   - Implement `setRubricText: (text) => set({ rubricText: text })` in the store
   - Update `setRubricFile` so that when file is set to `null`, it also clears `rubricText` to `""`:
     `setRubricFile: (file) => set({ rubricFile: file, ...(file === null && { rubricText: "" }) })`

2. In `src/api/types.ts`:
   - Change `GradeEssayRequest` to replace `rubricFile?: File` with `rubricText?: string`

3. In `src/api/grading.ts`:
   - Update mock `gradeEssay` to check `request.rubricText`. If rubricText is provided and non-empty, prepend to the `summary` field of the mock result: `"Graded against uploaded rubric. "` before the existing mock summary text. This is a simple indicator that rubric content was received.

4. In `src/pages/GradingPage.tsx`:
   - Import `rubricText` from store: `const rubricText = useAppStore((s) => s.rubricText);`
   - In both `handleSubmit` and `handleRegrade`, replace `rubricFile: rubricFile ?? undefined` with `rubricText: rubricText || undefined`
   - In `handleReset`, add `useAppStore.getState().setRubricText("")` (or pull setRubricText from store and call it -- though clearing rubricFile already clears rubricText per step 1, this is belt-and-suspenders)
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Store has rubricText field, API types use rubricText string instead of File, mock API acknowledges rubric presence, GradingPage passes rubricText to API. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Extract rubric PDF text on upload and show preview</name>
  <files>src/components/grading/RubricUpload.tsx</files>
  <action>
Update RubricUpload to extract text from uploaded PDFs and display a preview.

1. Import `extractTextFromPdf` from `@/lib/pdf-extract`.
2. Pull `setRubricText` from store: `const setRubricText = useAppStore((s) => s.setRubricText);`
3. Pull `rubricText` from store for display: `const rubricText = useAppStore((s) => s.rubricText);`
4. Add `const [isExtracting, setIsExtracting] = useState(false);` for loading state.

5. Make `handleFile` async. After the existing `setRubricFile(file)` call:
   - Set `setIsExtracting(true)`
   - Call `const text = await extractTextFromPdf(file)`
   - If text is empty, show `toast.error("Could not extract text from this PDF. The file may be image-based.")`
   - Otherwise call `setRubricText(text)` and show `toast.success("Rubric text extracted")`
   - Set `setIsExtracting(false)` in a finally block
   - Wrap in try/catch; on error show `toast.error("Failed to read rubric PDF")` and set `setIsExtracting(false)`

6. In the render, when `rubricFile` is truthy, show the existing file row AND below it add a rubric text preview section:
   - If `isExtracting`: show a small spinner with text "Extracting text..."
   - If `rubricText` is non-empty: show a `<div>` with `className="mt-3 max-h-32 overflow-y-auto rounded border bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap"` containing `rubricText` (truncated display is fine since it scrolls)
   - If `rubricText` is empty and not extracting: show a small warning text "No text could be extracted from this PDF"

7. When clearing (the X button onClick), it already calls `setRubricFile(null)` which now also clears rubricText per Task 1.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Uploading a rubric PDF extracts its text, shows a scrollable preview below the filename, handles errors with toasts, and clears properly. Build succeeds.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Manual spot-check: upload a PDF rubric, see extracted text preview appear below filename
</verification>

<success_criteria>
- Rubric PDF uploads extract text via pdfjs-dist and store it as rubricText
- Extracted rubric text is visible in a scrollable preview in the RubricUpload card
- Mock grading API receives rubricText and indicates rubric was used in its summary
- Clearing rubric clears both file and text
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/2-implement-pdf-reading-for-essay-and-rubr/2-SUMMARY.md`
</output>
