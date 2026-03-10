# Grading Page Toolbar Redesign

## Problem

The grading page uses a 50/50 split between essay input and rubric upload. The rubric section (a single PDF drop zone) wastes half the screen. With the new landing page, the grading page hero was removed, but the layout still doesn't maximize the essay editing space.

## Design

### Layout

Full-width essay textarea with a vertical icon toolbar on the right edge.

```
+--------------------------------------------------+---+
|                                                  | R | <- Upload Rubric
|                                                  | E | <- Upload Essay
|           Your Essay                             |---|
|                                                  | S | <- Word Stats
|     [Full-width textarea]                        | H | <- History
|                                                  | C | <- Clear
|                                                  | T | <- Tone
|                                                  | G | <- Settings
|                                                  |   |
+--------------------------------------------------+---+
| [Submit for Grading]                                 |
+------------------------------------------------------+
```

### Toolbar Behavior

- Default: small icons (~20px) in a narrow bar (~48px wide), muted colors
- Hover: icon scales up (1.2x), background highlight, color shift muted -> primary
- Active state: filled/highlighted icon (e.g., rubric icon shows dot when PDF attached, tone shows current selection)
- Tooltips on hover showing tool name

### Top Section (separated by divider)

**Upload Rubric** - opens centered modal dialog with drag/drop zone for PDF, "Choose File" button, shows attached filename with remove option. Toolbar icon gets indicator dot when rubric attached.

**Upload Essay** - opens file picker for .txt/.pdf import. Replaces current "Upload File" button inside essay card.

### Main Tools

**Word Stats** - toggles slim horizontal bar below textarea: words, characters, paragraphs, reading time

**History** - navigates to past grading submissions

**Clear** - resets essay text with confirmation (click again to confirm)

**Tone Selector** - popover with 4 selectable pills: Academic (default), Professional, Casual, Creative. Selected tone sent as context in grading prompt. Per-submission, not persisted.

**Settings** - popover with grade level override dropdown (Elementary, Middle School, High School, College). Label: "For this submission only". Defaults to user profile grade level, resets after submission.

### Files to Remove/Modify

- Delete `RubricUpload.tsx` as full card component (logic moves to modal)
- Remove 50/50 grid split from GradingPage
- Remove "Upload File" button from EssayInput
- Remove card wrapper from essay (direct editor feel)

### New Files

- `GradingToolbar.tsx` - vertical toolbar container with hover animations
- `RubricModal.tsx` - rubric upload dialog (reuses drag/drop logic)
- `ToneSelector.tsx` - popover with tone pills
- `GradingSettings.tsx` - popover with grade level override
- `WordStats.tsx` - collapsible stats bar

### Backend Changes

- Add `tone` parameter to grading API endpoint
- Include tone in LLM prompt context
- Grade level override sent as parameter (not persisted to user profile)

### Decisions

- Rubric is prominent (top of toolbar, separated) because it's core to the product value
- Tone and grade level override are per-submission only, not saved to profile
- Essay upload moves from inside the card to the toolbar for consistency
- Word stats toggle (not always visible) to keep the editor clean
