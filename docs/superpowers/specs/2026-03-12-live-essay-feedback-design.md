# Live Essay Feedback — Design Spec

## Overview

Replace the plain textarea essay input with a Tiptap-based editor that provides real-time spelling, grammar, and structural feedback as students write. Integrates LanguageTool's free API for language checks and client-side heuristics for rubric-aligned structural suggestions. Feedback is toggleable via the toolbar.

## Target User

Students writing essays to improve before submitting for full LLM-powered grading.

## Goals

- Real-time spelling and grammar feedback with inline underlines and click-to-fix suggestions
- Lightweight structural heuristics (thesis detection, paragraph length, evidence signals, conclusion check)
- Toggleable — students can turn live feedback on/off
- Writing timer to replace the History toolbar button
- No changes to the existing grading flow or post-grading highlight system

## Non-Goals

- LLM-powered rubric feedback (future enhancement — heuristics are the v1 placeholder)
- Rich text formatting (bold, italic, etc.) — the editor renders plain text only
- Custom dictionary or user-defined ignore lists

---

## Section 1: Editor Architecture

Replace `<Textarea>` with a Tiptap editor in `EssayInput.tsx`.

- Use `StarterKit` for basic text editing (paragraphs, hard breaks, undo/redo)
- Style the editor to match the current textarea appearance — no formatting toolbar, plain text only
- Sync plain text to `useAppStore.essayText` on every update so the grading API flow is untouched. Use a custom serializer that emits `\n\n` between paragraph nodes (matching textarea double-newline convention) so paragraph boundaries are preserved for heuristic analysis and grading
- Keep existing drag-and-drop file handling and file upload trigger
- Respect `textSize` and `disabled` props exactly as today

The `HighlightedEssay` component stays as-is. It receives `result.essayText` as a plain string and builds its own rendering — no shared editor state.

---

## Section 2: LanguageTool Integration

A new service module (`src/services/language-tool.ts`) handles communication with the LanguageTool API.

- Calls the free public API at `https://api.languagetool.org/v2/check`
- Sends the full essay text with `language: "auto"` for automatic language detection
- Returns an array of issues, each with: offset, length, message, suggested replacements, and issue type (spelling, grammar, style)

### Rate Limits & Error Handling

The free public LanguageTool API enforces rate limits (~20 req/min, ~10K character max per request). To stay within limits:

- **Debounce interval: 3 seconds** (not 1s) after typing stops — reduces request volume
- **Text length cap:** If essay exceeds 10,000 characters, only check the paragraph the cursor is in plus surrounding context
- **429 (rate limit) handling:** Back off silently, retry after 30 seconds. Show a subtle muted indicator on the toggle icon (not a toast — don't interrupt writing flow)
- **Network/API errors:** Fail silently. The toggle icon dims slightly to indicate feedback is unavailable. No toasts or error modals. Retry on next debounce cycle.
- **AbortController:** Cancel any in-flight request when a new debounce fires or toggle is turned off

### Debounced Checking

- After the student stops typing for ~3 seconds, fire a check request
- Cancel any in-flight request if they start typing again
- No checks fire while the toggle is off

### Issue Type Mapping

Each LanguageTool match maps to a Tiptap decoration (underline) with metadata attached:

- **Red wavy underline** — spelling errors
- **Blue wavy underline** — grammar issues
- **Yellow dashed underline** — style suggestions

### Hover/Click Interaction

Hovering an underlined word shows a small popover with:
- The issue message
- Replacement suggestions as clickable chips
- Clicking a suggestion applies the fix directly in the editor and removes that decoration. ProseMirror's `DecorationSet.map` handles offset adjustments for remaining decorations through the transaction. A fresh LanguageTool check is NOT triggered immediately — it fires naturally on the next debounce after the edit.
- An "Ignore" button dismisses the issue without changing text
- On touch devices (no hover), tap the underlined word to open the popover. Tap outside to dismiss.

---

## Section 3: Tiptap Decorations & Underline System

A custom Tiptap plugin (`src/components/editor/language-tool-plugin.ts`) manages decorations.

- Stores LanguageTool issues as a ProseMirror `DecorationSet`
- Each issue becomes an inline decoration at the correct character offset with a colored underline class
- When the document changes, decorations are **mapped** through the transaction to stay aligned with the text (ProseMirror handles this natively via `DecorationSet.map`)
- When a new LanguageTool response arrives, the old decoration set is replaced entirely

### Coexistence with Grading Highlights

These decorations only exist while the student is writing (pre-grading). Once grading results come back, the app switches to the `HighlightedEssay` component for display — no conflict between the two systems.

---

## Section 4: Heuristic Feedback (Lightweight Rubric-Aware Checks)

A client-side analysis module (`src/services/essay-heuristics.ts`) runs structural checks without any API calls.

### Checks

- **Thesis detection** — checks if the first paragraph contains signal phrases (e.g., "I argue," "This essay will," "The purpose of"). Flags if no thesis-like statement is found.
- **Paragraph length** — flags paragraphs that are too short (`MIN_SENTENCES = 2`) or too long (`MAX_SENTENCES = 8`) as potential structure issues. Thresholds defined as named constants for easy tuning.
- **Evidence signals** — scans for citation/evidence markers ("according to," "research shows," quotation marks, parenthetical references). Flags body paragraphs that lack any evidence signals.
- **Conclusion check** — flags if the final paragraph doesn't contain concluding language ("in conclusion," "therefore," "ultimately").

### Presentation

Displayed as subtle dismissible info-bar hints at the top or bottom of the editor — not inline underlines (to avoid cluttering the underline space that LanguageTool owns). Example: "Your second paragraph might benefit from supporting evidence."

### Execution

Runs on the same debounce as LanguageTool (after 3s of inactivity), but computed entirely client-side so it's instant.

### Future: Rubric-Aware

These are generic essay-writing heuristics aligned with the default rubric categories. The groundwork is there to make them rubric-specific later via LLM-powered analysis.

---

## Section 5: Toolbar Toggle, Timer & State Management

### Live Feedback Toggle

New toggle in `GradingToolbar` — a "Live Feedback" button (lucide `SpellCheck` or `Languages` icon):

- Toggles live feedback on/off
- Shows an active indicator dot when enabled (matching the rubric upload pattern)
- Disabled state while grading is in progress

### Writing Timer

Replace the History button (`Clock` icon) with a Writing Timer button (`Timer` lucide icon):

- Click opens a popover with preset durations: 15m, 30m, 45m, 1h, custom
- Once started, the toolbar icon shows a small countdown badge (e.g., "23:41")
- Timer counts down visually — when it hits zero, a gentle toast notification ("Time's up!") and the icon pulses briefly
- Click again while running to pause/resume or cancel
- Timer state lives in component state (not persisted — reloading the page resets it)

History remains accessible via the existing nav/essays page.

Note: The Writing Timer is independently shippable from the live feedback features.

### State

- Add `liveFeedbackEnabled: boolean` to `useAppStore` with `persist`. Defaults to `true` for new users. Must be added to the `partialize` return object and store version bumped from 3 to 4 with migration.
- Toggle on → debounced LanguageTool checks + heuristic analysis start running
- Toggle off → cancel any in-flight requests, clear all decorations and heuristic banners immediately
- Grading starts → live feedback is automatically disabled (the editor is replaced by `HighlightedEssay` in the results view, so decorations are naturally gone). When the user clicks "Grade Another" and returns to the editor, live feedback resumes if the toggle is still on.

### Issue Count Badge

When live feedback is active, show a small count badge on the toolbar icon indicating how many open issues remain.

---

## Section 6: File Structure

### New Files

- `src/components/editor/EssayEditor.tsx` — Tiptap editor component
- `src/components/editor/language-tool-plugin.ts` — ProseMirror plugin for underline decorations
- `src/components/editor/IssueBubble.tsx` — hover/click popover for issue details and suggestions
- `src/components/editor/HeuristicBanner.tsx` — dismissible info hints for structural feedback
- `src/components/editor/WritingTimer.tsx` — timer popover and countdown logic
- `src/services/language-tool.ts` — LanguageTool API client with debounce
- `src/services/essay-heuristics.ts` — client-side structural analysis

### Modified Files

- `src/components/grading/EssayInput.tsx` — swap `<Textarea>` for `<EssayEditor>`, keep file upload/drag-drop logic
- `src/components/grading/GradingToolbar.tsx` — replace History button with WritingTimer, add live feedback toggle
- `src/stores/app-store.ts` — add `liveFeedbackEnabled` boolean

### Untouched

- `src/components/results/HighlightedEssay.tsx` — no changes
- `src/lib/highlight-utils.ts` — no changes
- All backend files — no changes

### Dependencies

- `@tiptap/react` — React bindings for Tiptap
- `@tiptap/starter-kit` — core editing extensions
- `@tiptap/pm` — ProseMirror access for custom plugin (verify at implementation time whether `@tiptap/core` re-exports the needed APIs — if so, skip this dependency)

---

## Accessibility

- Issue popovers must be keyboard-navigable (focus trap, Escape to dismiss, Tab through suggestions)
- Screen reader: announce issue count changes via `aria-live` region
- Underline colors supplemented with distinct patterns (wavy vs dashed) so distinction doesn't rely solely on color
