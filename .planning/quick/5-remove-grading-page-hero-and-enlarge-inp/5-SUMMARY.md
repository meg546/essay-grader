---
phase: quick
plan: 5
subsystem: grading-ui
tags: [layout, ui, cleanup]
dependency_graph:
  requires: []
  provides:
    - "Full viewport split-pane grading layout"
  affects:
    - "src/pages/GradingPage.tsx"
    - "src/components/grading/EssayInput.tsx"
    - "src/components/grading/RubricUpload.tsx"
tech_stack:
  added: []
  patterns:
    - "Flex column layout with calc viewport height"
    - "Flex-1 panels for equal height split-pane"
key_files:
  created: []
  modified:
    - src/pages/GradingPage.tsx
    - src/components/grading/EssayInput.tsx
    - src/components/grading/RubricUpload.tsx
  deleted:
    - src/components/grading/HeroSection.tsx
decisions:
  - "Use h-[calc(100vh-7rem)] for viewport fill accounting for navbar + padding"
  - "Submit button in compact bottom bar with pt-4 shrink-0"
metrics:
  duration: "2min"
  completed: "2026-03-10"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_deleted: 1
---

# Quick Task 5: Remove Grading Page Hero and Enlarge Input Summary

Full viewport split-pane layout replacing hero/welcome section with flex-grow essay and rubric panels filling available height.

## What Changed

### Task 1: Remove hero section and restructure GradingPage layout (daa0523)
- Removed HeroSection import, AnimatePresence, motion imports
- Removed heroCollapsed state, scroll useEffect, and reset logic
- Deleted src/components/grading/HeroSection.tsx
- Changed container from max-w-1200 space-y-6 to max-w-1400 flex-col with calc viewport height
- Grid panels now use flex-1 min-h-0 to stretch and fill available space
- Submit button moved to compact bottom bar (pt-4 shrink-0)

### Task 2: Enlarge essay and rubric panels for split-pane layout (ac687e3)
- EssayInput Card uses flex flex-col h-full to stretch to grid cell height
- CardContent uses flex-1 flex flex-col min-h-0 so content fills the card
- Textarea changed from fixed h-64 to flex-1 with min-h-[200px]
- Drag-drop wrapper uses flex-1 flex flex-col min-h-0 so textarea can grow
- RubricUpload Card uses flex flex-col h-full to match essay panel
- CardContent uses flex-1 flex flex-col for content filling
- Empty-state drop zone uses flex-1 for large drop target area
- File-uploaded state uses flex-1 flex flex-col justify-center for vertical centering

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript: No new errors (pre-existing errors in grading logic and ProfilePage unrelated to changes)
- Vite build: Succeeds
- No HeroSection references remain in GradingPage
- HeroSection.tsx (grading-specific) deleted; landing page HeroSection unaffected

## Self-Check: PASSED
