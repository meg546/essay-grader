# Phase 3: Submission Flow - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the "Submit for Grading" button to call the mock `gradeEssay()` API, show a loading animation during the ~1.5s simulated delay, then automatically redirect the user to the results page with the grading data. This phase connects the input experience (Phase 2) to the results display (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Loading Animation
- Indeterminate spinner (not a progress bar) — honest representation since we don't know actual progress
- Friendly loading copy — warm, human-like tone (e.g., "Reviewing your work..." or "Reading through your essay...")
- Loading animation style (overlay vs inline vs dedicated page): Claude's discretion

### Edge Case Handling
- Submit button must be disabled during grading to prevent double-clicks
- All inputs (essay textarea and rubric editor) must be locked/disabled during grading — clear that submission is in progress
- Spinner in the submit button while grading

### Claude's Discretion
- Loading animation placement (full-page overlay, inline near button, or dedicated loading view)
- Redirect approach (instant navigate vs brief success indicator before navigating)
- Whether to clear essay/rubric inputs after successful submission or preserve them for re-grading
- Error handling for API failures (skip, basic toast, or more robust — mock API always succeeds)

</decisions>

<specifics>
## Specific Ideas

- The gradeEssay() function already exists with 1500ms delay — just need to wire it to the button click
- Store already has setCurrentResult() and addToHistory() — result should be stored before navigating
- Submit button already exists on GradingPage but has no click handler yet
- React Router's useNavigate() available for programmatic redirect to /results/:id

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/api/grading.ts`: `gradeEssay(request)` — async function with 1500ms delay, returns GradingResult
- `src/stores/app-store.ts`: `setCurrentResult()`, `addToHistory()`, `essayText`, `rubricCategories` — all state actions ready
- `src/components/ui/button.tsx`: shadcn Button with disabled state support
- Sonner Toaster already mounted in App.tsx for toast notifications

### Established Patterns
- Zustand store for all state management
- shadcn/ui components with Tailwind styling
- OKLCH warm sage/cream theme
- Toast notifications via Sonner (already set up for file upload errors)

### Integration Points
- `src/pages/GradingPage.tsx`: Submit button needs onClick handler — currently just a disabled Button
- `src/api/types.ts`: GradeEssayRequest interface (essayText + rubric[]) defines the submission payload
- `src/App.tsx`: Router already has /results route — needs to accept :id parameter for specific results
- Results page (Phase 4) will read currentResult from the store

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-submission-flow*
*Context gathered: 2026-03-08*
