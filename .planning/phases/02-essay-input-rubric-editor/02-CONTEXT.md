# Phase 2: Essay Input & Rubric Editor - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete input experience for the grading page: essay textarea with live word/character counts, file upload (.txt and .pdf) with drag-and-drop and PDF text extraction, and a fully editable rubric editor with ASAP defaults. This replaces the skeleton placeholders on GradingPage. Submission flow and results display are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Essay Input
- Word and character counts displayed below the textarea as small text (e.g., "245 words · 1,432 characters")
- No word count limits or warnings — just display the count, the AI grades whatever is submitted
- Counts update live as user types or pastes

### File Upload
- Drag and drop files directly onto the textarea itself (not a separate dedicated drop zone) — needs visual feedback on drag-over
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

</decisions>

<specifics>
## Specific Ideas

- The grading page skeleton already shows a two-column grid layout with essay on the left and rubric rows on the right — build on this structure
- ASAP rubric defaults: Content & Ideas, Organization, Style/Voice, Language Conventions — all on 0-6 scales (per RUBR-01)
- Zustand store (app-store.ts) and API types (types.ts with RubricCategory, GradeEssayRequest) already exist — rubric state should use these

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx`: shadcn Button component — use for submit, add category, reset buttons
- `src/components/ui/sheet.tsx`: shadcn Sheet — already used for mobile nav, pattern established
- `src/api/types.ts`: RubricCategory (name, maxScore) and GradeEssayRequest (essayText, rubric[]) already defined
- `src/stores/app-store.ts`: Zustand store with currentResult and history — extend for essay/rubric input state

### Established Patterns
- shadcn/ui + Tailwind CSS with OKLCH color variables
- Warm sage/cream theme with rounded-lg/xl corners
- System fonts, centered max-width content (960px)
- React Router v7 for navigation

### Integration Points
- `src/pages/GradingPage.tsx`: Currently a skeleton placeholder — this phase replaces it with real input components
- `src/api/types.ts`: RubricCategory interface defines the rubric data shape
- `src/stores/app-store.ts`: Extend store to hold essay text and rubric state (persists across navigation per RUBR-05 requirement)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-essay-input-rubric-editor*
*Context gathered: 2026-03-08*
