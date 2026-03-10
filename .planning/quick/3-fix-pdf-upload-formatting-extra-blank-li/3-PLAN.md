---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/pdf-extract.ts
autonomous: true
requirements: [QUICK-3]
must_haves:
  truths:
    - "PDF text extraction produces single newlines between normal lines"
    - "Only actual paragraph gaps (large vertical spacing) produce double newlines"
    - "Consecutive blank lines are collapsed as a safety net"
  artifacts:
    - path: "src/lib/pdf-extract.ts"
      provides: "PDF text extraction with correct paragraph detection"
      contains: "item.height * 2.5"
  key_links:
    - from: "src/lib/pdf-extract.ts"
      to: "EssayInput.tsx"
      via: "extractTextFromPdf called on file upload"
      pattern: "extractTextFromPdf"
---

<objective>
Fix PDF text extraction producing double-spaced output by adjusting the paragraph detection threshold.

Purpose: Currently every line in a PDF triggers a double newline because the gap threshold (`item.height * 1.5`) is too low for typical PDF line spacing (~1.2x font height). This makes uploaded essays appear with blank lines between every line.

Output: Corrected `pdf-extract.ts` that preserves original document structure -- single newlines between normal lines, double newlines only for actual paragraph breaks.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/pdf-extract.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix paragraph detection threshold and add newline collapsing</name>
  <files>src/lib/pdf-extract.ts</files>
  <action>
In `src/lib/pdf-extract.ts`, make two changes:

1. **Line 26 -- Increase paragraph gap threshold:** Change `item.height * 1.5` to `item.height * 2.5`. Typical PDF line spacing is 1.2x font height, so 2.5x ensures only real paragraph gaps (which are usually 2x+ line height) trigger double newlines. Normal inter-line gaps (~1.2x) will correctly get single `\n`.

2. **After the page loop (before the return) -- Collapse excessive blank lines:** After `pageTexts.join("\n\n").trim()`, add a `.replace(/\n{3,}/g, "\n\n")` call to collapse any runs of 3+ newlines down to exactly 2. This acts as a safety net against edge cases where multiple consecutive items produce extra newlines.

The final lines should look like:
```typescript
const fullText = pageTexts.join("\n\n").trim();
return fullText.length === 0 ? "" : fullText.replace(/\n{3,}/g, "\n\n");
```
  </action>
  <verify>
    <automated>npx tsc --noEmit src/lib/pdf-extract.ts</automated>
  </verify>
  <done>
    - Paragraph threshold is `item.height * 2.5` (not 1.5)
    - Return value includes `.replace(/\n{3,}/g, "\n\n")` collapsing
    - TypeScript compiles without errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed PDF text extraction to preserve original document line structure instead of double-spacing every line.</what-built>
  <how-to-verify>
    1. Run the dev server: `npm run dev`
    2. Upload a multi-paragraph PDF essay
    3. Verify the extracted text shows:
       - Single newlines between lines within a paragraph (or lines flow together naturally)
       - Double newlines (one blank line) between actual paragraphs
       - No excessive blank lines throughout the text
    4. Compare with the same PDF's visual layout -- spacing should roughly match
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- Manual: Upload a PDF and confirm line spacing matches original document structure
</verification>

<success_criteria>
- PDF uploads no longer produce double-spaced text
- Normal line breaks within paragraphs use single newlines
- Paragraph breaks use double newlines
- No runs of 3+ consecutive newlines in output
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-pdf-upload-formatting-extra-blank-li/3-SUMMARY.md`
</output>
