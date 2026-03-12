---
phase: 19-tiptap-editor-foundation
plan: 01
subsystem: ui
tags: [tiptap, prosemirror, react, zustand, editor, rich-text]

# Dependency graph
requires:
  - phase: app-store
    provides: "TextSize type, textSize/setTextSize in Zustand store, setEssayText contract"
provides:
  - "Tiptap v3 plain text editor replacing textarea in EssayInput.tsx"
  - "TextSizeSelector toolbar button (small/normal/large) in GradingToolbar"
  - "One-way Zustand sync pattern: editor.getText() -> store via onUpdate"
  - "File drag-and-drop and upload preserved with editor content sync"
affects: [20-languagetool-decorations, grading-page, word-stats]

# Tech tracking
tech-stack:
  added:
    - "@tiptap/react@3.20.1"
    - "@tiptap/pm@3.20.1"
    - "@tiptap/starter-kit@3.20.1"
    - "@tiptap/extension-character-count@3.20.1"
  patterns:
    - "One-way Zustand sync: useAppStore.getState().setEssayText() in onUpdate (avoids stale closure)"
    - "immediatelyRender: false for React 19 compatibility"
    - "editorProps.attributes.class via setOptions for reactive text size"
    - "setContent exception pattern for explicit user file load actions"

key-files:
  created:
    - "src/components/grading/TextSizeSelector.tsx"
  modified:
    - "src/components/grading/EssayInput.tsx"
    - "src/components/grading/GradingToolbar.tsx"
    - "src/pages/GradingPage.tsx"
    - "package.json"

key-decisions:
  - "Use getState().setEssayText in onUpdate to avoid stale closure (Pitfall 3 from research)"
  - "setOptions called each render to keep editorProps.attributes.class reactive to textSize"
  - "setContent allowed for explicit file load (the one exception to no-setContent-after-mount rule)"
  - "Removed unused essayText and onUploadEssayFile props from GradingToolbar (toolbar uses EssayUploadModal internally)"

patterns-established:
  - "One-way editor->store sync: editor.getText({ blockSeparator: '\\n\\n' }) -> setEssayText in onUpdate"
  - "TextSizeSelector Popover+Tooltip composition matching existing toolbar button pattern"

requirements-completed: [EDIT-01, EDIT-03]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 19 Plan 01: Tiptap Editor Foundation Summary

**Tiptap v3 plain text editor (StarterKit, CharacterCount, one-way Zustand sync) replacing textarea, with TextSizeSelector toolbar button**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T16:55:07Z
- **Completed:** 2026-03-12T17:00:12Z
- **Tasks:** 2
- **Files modified:** 7 (4 task files + 3 pre-existing error fixes)

## Accomplishments
- Replaced Textarea with Tiptap EditorContent in EssayInput.tsx — preserves all existing behavior (forwardRef handle, drag-drop, file upload)
- Established one-way sync pattern: editor writes to Zustand via getState().setEssayText() on each update; store never writes back to editor after mount
- Added TextSizeSelector to GradingToolbar with Small/Normal/Large options; text size class applied reactively via setOptions on each render
- Build passes cleanly; all TypeScript errors resolved

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tiptap and replace textarea with Tiptap editor** - `381667c` (feat)
2. **Task 2: Add text size selector to the toolbar** - `54ef82b` (feat)

## Files Created/Modified
- `src/components/grading/EssayInput.tsx` - Replaced Textarea with Tiptap useEditor + EditorContent; preserves EssayInputHandle, drag-drop, file upload
- `src/components/grading/TextSizeSelector.tsx` - New toolbar button with Popover showing Small/Normal/Large options; reads/writes store directly
- `src/components/grading/GradingToolbar.tsx` - Added TextSizeSelector; removed unused essayText and onUploadEssayFile props
- `src/pages/GradingPage.tsx` - Updated GradingToolbar usage to match updated prop interface
- `package.json` - Added @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-character-count at 3.20.1

## Decisions Made
- Used `useAppStore.getState().setEssayText` inside `onUpdate` (not a destructured hook value) to avoid stale closure bug per Pitfall 3 from research
- Called `editor.setOptions({ editorProps: { attributes: { class: ... } } })` on each render to keep the text size class reactive — this is idiomatic Tiptap v3 (editorProps is mutable option)
- `setContent` is called when a file is loaded (explicit user action) to sync the editor DOM — this is the documented exception to the no-setContent-after-mount rule
- Removed `essayText` and `onUploadEssayFile` from GradingToolbar props; toolbar uses its own EssayUploadModal for file upload and doesn't need essayText directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TypeScript errors blocking the build**
- **Found during:** Task 1 (build verification)
- **Issue:** 5 files had pre-existing TS errors: unused `React` import in popover.tsx/tooltip.tsx, unused `index` in HowItWorks.tsx, unused `displayText` in EssayPanel.tsx, overly wide `ease: string` type in FeatureHighlights.tsx. These existed before this plan but weren't caught by incremental tsc cache. Adding Tiptap triggered full recompilation which exposed them.
- **Fix:** Removed unused `React` namespace imports; removed unused `index` parameter; removed unused `displayText` variable; narrowed `ease` type with `as const`
- **Files modified:** src/components/ui/popover.tsx, src/components/ui/tooltip.tsx, src/components/landing/HowItWorks.tsx, src/components/results/EssayPanel.tsx, src/components/landing/FeatureHighlights.tsx
- **Verification:** npm run build passes with no TypeScript errors
- **Committed in:** 381667c (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused GradingToolbar props that would fail TS compilation**
- **Found during:** Task 2 (modifying GradingToolbar)
- **Issue:** `essayText` and `onUploadEssayFile` were in GradingToolbarProps but never used in the component body (toolbar uses EssayUploadModal). TypeScript `noUnusedParameters` flagged them.
- **Fix:** Removed the props from the interface and component signature; updated GradingPage.tsx callsite
- **Files modified:** src/components/grading/GradingToolbar.tsx, src/pages/GradingPage.tsx
- **Verification:** Build passes; GradingPage still compiles with EssayInput ref intact
- **Committed in:** 54ef82b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking build, 1 bug fix)
**Impact on plan:** Both fixes necessary for correct compilation. No scope creep. GradingPage's ref to EssayInput is preserved (triggerFileUpload still callable even though toolbar no longer surfaces it directly).

## Issues Encountered
- Tiptap `setContent` second argument `false` (to skip history) has a different type signature in v3 — resolved by passing only the content argument (default behavior is correct for explicit file loads)

## Self-Check: PASSED

All created/modified files verified to exist. All commits verified in git log.

## Next Phase Readiness
- Tiptap editor foundation complete — Phase 20 (LanguageTool decorations) can build on top of the editor instance
- ProseMirror plugin state for decorations should be the next integration point (see Phase 20 plan)
- CharacterCount extension installed — available for Phase 20 to use `editor.storage.characterCount` if needed
- Known concern: LanguageTool CORS must be verified in browser during Phase 20 — FastAPI proxy plan ready as fallback

---
*Phase: 19-tiptap-editor-foundation*
*Completed: 2026-03-12*
