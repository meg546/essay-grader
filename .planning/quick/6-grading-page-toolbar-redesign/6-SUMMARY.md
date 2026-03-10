# Quick Task 6: Grading Page Toolbar Redesign

**Status:** Complete
**Date:** 2026-03-10

## What Changed

Replaced the 50/50 essay/rubric split layout with a full-width essay textarea and vertical icon toolbar on the right edge.

### Backend (Task 1 — `fbcf185`)
- Added `tone` parameter to grading API endpoint, service layer, and LLM prompt
- 4 tone options: Academic, Professional, Casual, Creative
- Tone context injected into system prompt for the LLM

### Toolbar Components (Task 2 — `32485a6`)
- **GradingToolbar** — Vertical icon bar with hover animations (scale + color)
- **RubricModal** — Dialog with drag/drop zone for PDF rubric upload
- **EssayUploadModal** — Dialog with drag/drop for .txt/.pdf essay upload
- **ToneSelector** — Popover with 4 tone pills (vertical layout, centered text)
- **GradingSettings** — Popover with grade level override dropdown (per-submission)
- **WordStats** — Collapsible stats bar (words, characters, paragraphs, reading time)
- Clear button opens confirmation popover with theme-colored confirm button

### Layout Restructure (Task 3 — `4b4f9b1`)
- Removed 50/50 grid split, essay textarea fills full width
- Removed Card wrapper from EssayInput for clean editor feel
- EssayInput exposes imperative handle for file upload triggering
- Tone and grade level override passed through to `gradeEssay()` API call

### UI Polish (Task 4 — `6ca9a45`)
- Fixed tone selector pill overflow (vertical layout, centered text)
- Clear button changed from double-click to popover confirmation
- Essay upload button opens modal dialog (matching rubric modal style)
- Settings dropdown shows formatted labels instead of raw values

## Files Modified

- `backend/app/routes/grading.py` — tone form parameter
- `backend/app/services/grading.py` — tone passed to prompt builder
- `backend/app/llm/prompts.py` — tone context in system prompt
- `src/api/grading.ts` — tone in FormData
- `src/components/grading/GradingToolbar.tsx` — new vertical toolbar
- `src/components/grading/RubricModal.tsx` — new rubric upload dialog
- `src/components/grading/EssayUploadModal.tsx` — new essay upload dialog
- `src/components/grading/ToneSelector.tsx` — new tone popover
- `src/components/grading/GradingSettings.tsx` — new settings popover
- `src/components/grading/WordStats.tsx` — new stats bar
- `src/components/grading/EssayInput.tsx` — removed card wrapper, added imperative handle
- `src/pages/GradingPage.tsx` — full-width layout with toolbar integration
- `src/components/ui/popover.tsx` — shadcn popover component
- `src/components/ui/tooltip.tsx` — shadcn tooltip component
