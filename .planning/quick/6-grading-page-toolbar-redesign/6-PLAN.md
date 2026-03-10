---
phase: quick-6
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/app/routes/grading.py
  - backend/app/services/grading.py
  - backend/app/llm/prompts.py
  - src/api/grading.ts
  - src/components/grading/GradingToolbar.tsx
  - src/components/grading/RubricModal.tsx
  - src/components/grading/ToneSelector.tsx
  - src/components/grading/GradingSettings.tsx
  - src/components/grading/WordStats.tsx
  - src/components/grading/EssayInput.tsx
  - src/pages/GradingPage.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/tooltip.tsx
autonomous: false
requirements: [TOOLBAR-REDESIGN]

must_haves:
  truths:
    - "Essay textarea fills full width with vertical toolbar on right edge"
    - "User can upload rubric via modal dialog from toolbar icon"
    - "User can upload essay file from toolbar icon"
    - "User can toggle word stats bar below textarea"
    - "User can select tone (Academic/Professional/Casual/Creative) from toolbar popover"
    - "User can override grade level per-submission from toolbar settings popover"
    - "User can clear essay with confirmation (double-click)"
    - "Tone parameter is sent to backend and included in LLM prompt"
    - "Toolbar icons show hover animation (scale + color shift)"
  artifacts:
    - path: "src/components/grading/GradingToolbar.tsx"
      provides: "Vertical icon toolbar with hover animations"
    - path: "src/components/grading/RubricModal.tsx"
      provides: "Modal dialog for rubric PDF upload with drag/drop"
    - path: "src/components/grading/ToneSelector.tsx"
      provides: "Popover with 4 tone pills"
    - path: "src/components/grading/GradingSettings.tsx"
      provides: "Popover with grade level override"
    - path: "src/components/grading/WordStats.tsx"
      provides: "Collapsible stats bar"
  key_links:
    - from: "src/pages/GradingPage.tsx"
      to: "src/api/grading.ts"
      via: "tone parameter passed through gradeEssay call"
      pattern: "gradeEssay.*tone"
    - from: "backend/app/routes/grading.py"
      to: "backend/app/services/grading.py"
      via: "tone form field forwarded to grading_service.grade()"
      pattern: "tone.*Form"
    - from: "backend/app/services/grading.py"
      to: "backend/app/llm/prompts.py"
      via: "tone passed to build_system_prompt"
      pattern: "build_system_prompt.*tone"
---

<objective>
Replace the 50/50 essay/rubric split layout with a full-width essay textarea and a vertical icon toolbar on the right edge. Move rubric upload to a modal dialog. Add tone selector, per-submission grade level override, word stats toggle, and clear-with-confirm to the toolbar. Add tone parameter to the backend grading API and LLM prompt.

Purpose: Maximize essay editing space and provide quick-access tools without cluttering the editor.
Output: Redesigned grading page with toolbar, new backend tone parameter.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/plans/2026-03-10-grading-page-toolbar-design.md
@src/pages/GradingPage.tsx
@src/components/grading/EssayInput.tsx
@src/components/grading/RubricUpload.tsx
@src/api/grading.ts
@src/stores/app-store.ts
@src/stores/profile-store.ts
@backend/app/routes/grading.py
@backend/app/services/grading.py
@backend/app/llm/prompts.py

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/stores/app-store.ts:
```typescript
interface AppState {
  essayText: string;
  rubricFile: File | null;
  rubricText: string;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
  // ... other fields
}
```

From src/stores/profile-store.ts:
```typescript
export type GradeLevel = "elementary" | "middle-school" | "high-school" | "college";
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string>;
```

From src/api/grading.ts:
```typescript
export async function gradeEssay(
  essayText: string,
  gradeLevel: string,
  rubricFile?: File | null,
  rubricText?: string,
): Promise<GradingResult>;
// Uses FormData with apiClient.post("/grade", formData)
```

From backend/app/llm/prompts.py:
```python
def build_system_prompt(grade_level: str, rubric_text: str | None) -> str:
def build_user_prompt(essay_text: str) -> str:
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tone parameter to backend API and LLM prompt</name>
  <files>backend/app/routes/grading.py, backend/app/services/grading.py, backend/app/llm/prompts.py, src/api/grading.ts</files>
  <action>
    **backend/app/routes/grading.py:**
    - Add `tone: str = Form("academic")` parameter to `grade_essay` endpoint (after `grade_level`)
    - Pass `tone` to `grading_service.grade()` call: `grading_service.grade(essay_text, rubric_text, grade_level, tone)`

    **backend/app/services/grading.py:**
    - Add `tone: str = "academic"` parameter to `GradingService.grade()` method signature
    - Pass `tone` to `build_system_prompt()`: `build_system_prompt(grade_level, rubric_text, tone)`

    **backend/app/llm/prompts.py:**
    - Add tone context mapping dict `_TONE_CONTEXT` with 4 entries:
      - `"academic"`: "Use formal academic language. Evaluate for scholarly tone, precision, and objectivity."
      - `"professional"`: "Use professional business language. Evaluate for clarity, conciseness, and appropriate formality."
      - `"casual"`: "Use conversational language. Evaluate for readability, engagement, and natural voice."
      - `"creative"`: "Use expressive language. Evaluate for originality, vivid imagery, and stylistic flair."
    - Add `tone: str = "academic"` parameter to `build_system_prompt()`
    - Insert tone context into system prompt after the grade level context section:
      ```
      ## Tone Context

      {tone_context}
      ```

    **src/api/grading.ts:**
    - Add `tone?: string` parameter to `gradeEssay()` function (after rubricText)
    - Add `tone` parameter to `gradeEssay()` signature: `gradeEssay(essayText, gradeLevel, rubricFile, rubricText, tone)`
    - Append `formData.append("tone", tone || "academic")` in the function body
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && grep -n "tone" backend/app/routes/grading.py backend/app/services/grading.py backend/app/llm/prompts.py src/api/grading.ts | head -20</automated>
  </verify>
  <done>Backend accepts tone parameter, includes tone context in LLM prompt, frontend API client sends tone in FormData</done>
</task>

<task type="auto">
  <name>Task 2: Create toolbar components (GradingToolbar, RubricModal, ToneSelector, GradingSettings, WordStats)</name>
  <files>src/components/grading/GradingToolbar.tsx, src/components/grading/RubricModal.tsx, src/components/grading/ToneSelector.tsx, src/components/grading/GradingSettings.tsx, src/components/grading/WordStats.tsx, src/components/ui/popover.tsx, src/components/ui/tooltip.tsx</files>
  <action>
    **First, install shadcn/ui popover and tooltip components:**
    ```
    npx shadcn@latest add popover tooltip -y
    ```

    **src/components/grading/WordStats.tsx:**
    - Props: `{ essayText: string; visible: boolean }`
    - When `visible`, render a slim horizontal bar (h-8, bg-muted, rounded, px-4, flex items-center gap-6, text-xs text-muted-foreground)
    - Stats: words (split on whitespace), characters (length), paragraphs (split on double newline), reading time (words/200 rounded up + "min")
    - When not visible, render null
    - Animate with transition-all duration-200

    **src/components/grading/RubricModal.tsx:**
    - Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`
    - Use shadcn Dialog component (already available in ui/dialog.tsx)
    - Dialog content: title "Upload Rubric", description "Upload your assignment rubric (PDF)"
    - Drag/drop zone (reuse same pattern as current RubricUpload.tsx — border-2 border-dashed, Upload icon, "Choose File" button)
    - When rubric is attached: show filename with FileText icon and X remove button (same as current RubricUpload attached state)
    - Use `useAppStore` for rubricFile/setRubricFile
    - On file accepted, call setRubricFile and close dialog

    **src/components/grading/ToneSelector.tsx:**
    - Props: `{ tone: string; onToneChange: (tone: string) => void }`
    - Use Popover component with PopoverTrigger (the toolbar button passes trigger) and PopoverContent
    - Export as a popover content component that receives trigger externally
    - Actually, make it self-contained: render PopoverTrigger as the toolbar icon button, PopoverContent with 4 pill buttons in a 2x2 grid
    - Tones: Academic (default), Professional, Casual, Creative
    - Each pill: rounded-full px-3 py-1.5 text-xs font-medium, selected = bg-primary text-primary-foreground, unselected = bg-muted hover:bg-muted/80
    - Label at top: "Feedback Tone" in text-xs font-medium text-muted-foreground
    - On select, call onToneChange and close popover

    **src/components/grading/GradingSettings.tsx:**
    - Props: `{ gradeLevelOverride: string | null; onGradeLevelChange: (level: string | null) => void; userGradeLevel: string | null }`
    - Use Popover component
    - PopoverContent: label "For this submission only" (text-xs text-muted-foreground mb-2), then a Select dropdown (from ui/select.tsx) with grade level options: Elementary, Middle School, High School, College
    - Default shows user's profile grade level (from props). Selecting a value calls onGradeLevelChange
    - Include small "Reset" text-button to set back to null (use profile default)

    **src/components/grading/GradingToolbar.tsx:**
    - Props: `{ disabled?: boolean; essayText: string; onClear: () => void; tone: string; onToneChange: (tone: string) => void; gradeLevelOverride: string | null; onGradeLevelChange: (level: string | null) => void; userGradeLevel: string | null; onUploadEssayFile: () => void }`
    - Render a vertical bar: `flex flex-col items-center w-12 bg-muted/30 border-l py-2 gap-1 shrink-0`
    - **Top section** (separated by a thin border-b divider after):
      - Upload Rubric button: BookOpen icon from lucide-react. On click, opens RubricModal (internal state). Show small green dot indicator (absolute positioned, w-2 h-2 rounded-full bg-green-500) when rubricFile is not null (read from useAppStore)
      - Upload Essay button: FileUp icon. On click, calls `onUploadEssayFile` prop
    - **Divider:** `<div className="w-6 border-b my-1" />`
    - **Main tools:**
      - Word Stats toggle: BarChart3 icon. Internal boolean state `showStats`. Toggle on click. Active state = bg-primary/10 text-primary
      - History: Clock icon. On click, navigate to `/history` using `useNavigate` from react-router-dom
      - Clear: Eraser icon. First click sets `confirmClear` state to true and changes icon color to destructive (text-destructive). Second click within 2 seconds calls `onClear()` and resets. After 2s timeout, reset confirmClear to false. Use Tooltip to show "Click again to clear"
      - Tone: MessageSquare icon. Wraps ToneSelector popover. Show first letter of current tone as tiny badge (absolute, text-[8px])
      - Settings: Settings icon. Wraps GradingSettings popover. Show dot indicator if grade level is overridden

    - **Each toolbar button:** Use Tooltip for hover label. Style: `group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:bg-primary/10 hover:scale-110 text-muted-foreground hover:text-primary cursor-pointer`. Icon size: `h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]`

    - The toolbar exposes `showStats` state so the parent can conditionally render WordStats. Use a render prop or have toolbar accept `onStatsToggle` and manage externally. **Decision: toolbar manages showStats internally and renders WordStats below itself? No -- WordStats goes below the textarea, so expose via callback.** Add `onStatsToggle: (visible: boolean) => void` prop, call it when toggling.

    - RubricModal rendered inside GradingToolbar (internal open state)
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All 5 toolbar components compile without errors. GradingToolbar renders vertical icon bar with hover animations, RubricModal handles PDF upload, ToneSelector shows 4 pill options, GradingSettings shows grade level override, WordStats shows/hides stats bar.</done>
</task>

<task type="auto">
  <name>Task 3: Restructure GradingPage and EssayInput — remove split layout, integrate toolbar</name>
  <files>src/pages/GradingPage.tsx, src/components/grading/EssayInput.tsx</files>
  <action>
    **src/components/grading/EssayInput.tsx:**
    - Remove Card/CardHeader/CardTitle/CardContent wrapper entirely (direct editor feel)
    - Remove the "Upload File" Button and hidden file input (moved to toolbar)
    - Remove the word count / character count paragraph at bottom (moved to WordStats)
    - Keep: Textarea with drag/drop support for essay files (.txt/.pdf), all drag handlers, readFileAsText utility
    - Export the `handleFile` function concept so toolbar can trigger file upload: add a `fileInputRef` that the parent can access. **Simpler: keep the hidden file input in EssayInput but expose a ref or accept an `uploadTriggerRef` prop** — actually simplest is to keep a hidden input in EssayInput and expose an imperative handle via `forwardRef`/`useImperativeHandle` with `{ triggerFileUpload: () => void }`. The toolbar calls this to open the file picker.
    - New props: `{ disabled?: boolean; onFocus?: () => void; triggerUploadRef?: React.RefObject<{ triggerFileUpload: () => void } | null> }`
    - Use `useImperativeHandle` to expose `triggerFileUpload` which clicks the hidden file input
    - Textarea should fill available space: `className="flex-1 resize-none overflow-y-auto min-h-[200px] border-0 focus-visible:ring-0 rounded-none text-base leading-relaxed p-4"` — remove border so it looks like a clean editor, not an input field
    - Keep the drag-over ring styling on the outer wrapper div

    **src/pages/GradingPage.tsx:**
    - Remove `import { RubricUpload }` — no longer used as a standalone component
    - Add imports for GradingToolbar and WordStats
    - Add local state: `tone` (string, default "academic"), `gradeLevelOverride` (string | null, default null), `showStats` (boolean, default false)
    - Create a ref for EssayInput imperative handle: `const essayInputRef = useRef<{ triggerFileUpload: () => void }>(null)`
    - **Grading input layout** (replaces the current `grid md:grid-cols-2`):
      ```
      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <EssayInput ref={essayInputRef} disabled={isGrading} />
          <WordStats essayText={essayText} visible={showStats} />
        </div>
        <GradingToolbar
          disabled={isGrading}
          essayText={essayText}
          onClear={() => { setEssayText(""); setRubricFile(null); }}
          tone={tone}
          onToneChange={setTone}
          gradeLevelOverride={gradeLevelOverride}
          onGradeLevelChange={setGradeLevelOverride}
          userGradeLevel={gradeLevel}
          onUploadEssayFile={() => essayInputRef.current?.triggerFileUpload()}
          onStatsToggle={setShowStats}
        />
      </div>
      ```
    - Update `handleSubmit` and `handleRegrade`: pass effective grade level (`gradeLevelOverride || gradeLevel || "college"`) and tone to `gradeEssay()`:
      ```typescript
      const effectiveGradeLevel = gradeLevelOverride || gradeLevel || "college";
      const result = await gradeEssay(essayText, effectiveGradeLevel, rubricFile, undefined, tone);
      ```
    - After successful grading, reset per-submission state: `setTone("academic"); setGradeLevelOverride(null);`
    - Remove `handleReset` clearing of rubricFile (now handled by toolbar's clear)
    - **Do NOT delete RubricUpload.tsx file** — leave it but it's no longer imported. Can be cleaned up later.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20 && echo "---BUILD---" && npx vite build 2>&1 | tail -5</automated>
  </verify>
  <done>GradingPage shows full-width essay editor with vertical toolbar on right. No 50/50 split. No card wrapper on essay. Build succeeds with no type errors.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Grading page toolbar redesign: full-width essay textarea with vertical icon toolbar on right edge. Toolbar has Upload Rubric (opens modal), Upload Essay (file picker), Word Stats toggle, History nav, Clear with confirm, Tone Selector popover (4 options), and Settings popover (grade level override). Hover animations on icons. Tone parameter sent to backend LLM prompt.</what-built>
  <how-to-verify>
    1. Navigate to the grading page (sign in first if needed)
    2. Verify the essay textarea fills the full width with a narrow icon toolbar on the right edge (no 50/50 split)
    3. Hover over toolbar icons — they should scale up slightly and change color from muted to primary
    4. Click the top Rubric icon — a modal should open with drag/drop zone and "Choose File" button. Upload a PDF, verify the icon gets a green dot indicator. Re-open modal to see attached filename with remove option
    5. Click the Essay upload icon — file picker should open for .txt/.pdf. Select a file, verify text appears in textarea
    6. Click Word Stats icon — a slim bar should appear below the textarea showing words, characters, paragraphs, reading time. Click again to hide
    7. Click Tone icon — popover with 4 pills (Academic, Professional, Casual, Creative). Select one, verify it closes
    8. Click Settings icon — popover with grade level dropdown. Select a different level
    9. Click Clear icon once — it should turn red/destructive. Click again within 2 seconds to clear the essay. If you wait >2s, it resets
    10. Submit an essay for grading — verify it still works end-to-end with tone and grade level override applied
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues with the toolbar layout, interactions, or styling</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npx vite build` completes successfully
- Grading endpoint accepts tone parameter (curl test or UI submission)
- All toolbar interactions work (rubric modal, tone popover, settings popover, word stats toggle, clear confirm, essay upload)
</verification>

<success_criteria>
- Full-width essay editor with vertical toolbar on right edge (no 50/50 split)
- All 7 toolbar tools functional (rubric, essay upload, word stats, history, clear, tone, settings)
- Tone parameter flows from UI -> API -> LLM prompt
- Hover animations on toolbar icons (scale + color)
- Grade level override is per-submission only (resets after grading)
</success_criteria>

<output>
After completion, create `.planning/quick/6-grading-page-toolbar-redesign/6-SUMMARY.md`
</output>
