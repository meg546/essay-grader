---
phase: 15-lt-suggestion-popup
plan: "01"
subsystem: editor-ux
tags: [languagetool, tiptap, popup, prosemirror, grammarly-ui]
dependency_graph:
  requires: [LanguageTool extension (Phase 20-02), ltPluginKey, LTMatch API type]
  provides: [LTPopup component, clickable underline interactions]
  affects: [EssayInput, LanguageTool decorations]
tech_stack:
  added: [react-dom createPortal, lucide-react X icon]
  patterns: [portal-rendered floating UI, ProseMirror plugin state mutation for dismiss]
key_files:
  created:
    - src/components/grading/LTPopup.tsx
  modified:
    - src/extensions/LanguageTool.ts
    - src/components/grading/EssayInput.tsx
    - src/index.css
decisions:
  - Captured editor.view in local variable inside scroll useEffect to satisfy TypeScript narrowing (editor is Editor | null in outer scope but used in inner function)
  - Used mousedown listener (not click) for outside-close to avoid race with editor click handler
  - Positioned popup via fixed positioning using getBoundingClientRect() + createPortal to document.body to escape overflow:hidden containers
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_changed: 4
---

# Phase 15 Quick Task: LanguageTool Suggestion Popup Summary

**One-liner:** Grammarly-style floating card popup triggered by clicking LT-underlined text, with replacement chips, dismiss, and Esc/outside-close via ProseMirror portal.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Extend decoration attributes and create LTPopup component | 9568df3 |
| 2 | Wire LTPopup into EssayInput | 72e779d |

## What Was Built

### LTPopup Component (`src/components/grading/LTPopup.tsx`)

A self-contained floating card that:
- Attaches a `click` listener on `editor.view.dom`; walks up to find `[data-lt-message]` attribute via `closest()`
- Extracts message, replacements (JSON), from/to positions, and category from decoration data attributes
- Positions itself via `fixed` + `getBoundingClientRect()` — portaled to `document.body` to avoid `overflow:hidden` clipping
- Shows: colored category dot (red=spelling, blue=grammar, amber=style), error message, up to 5 replacement chips, dismiss button, X close button
- Replacement chips: dispatch ProseMirror `replaceWith` transaction, then close
- Dismiss: reads `ltPluginKey` plugin state, calls `.remove()` on matching decorations, dispatches with `setMeta(ltPluginKey, newSet)`
- Closes on: Esc key, click outside (mousedown listener), clicking non-decoration in editor

### LanguageTool.ts Decoration Updates

Added to each `Decoration.inline()` call:
- `style: 'cursor: pointer'` — inline pointer cursor
- `'data-lt-from': String(from)` — ProseMirror start position
- `'data-lt-to': String(to)` — ProseMirror end position
- `'data-lt-category': match.rule.issueType.toLowerCase()` — for dot color and label

### index.css Update

Added `.lt-misspelling, .lt-grammar, .lt-style { cursor: pointer; }` as belt-and-suspenders alongside inline style.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript narrowing failure in scroll useEffect inner function**
- **Found during:** Task 2 build (tsc -b)
- **Issue:** `editor` typed as `Editor | null` — TypeScript cannot narrow it inside nested `handleScroll` function even after outer `if (!editor)` guard
- **Fix:** Captured `const editorView = editor.view` before defining inner function so TypeScript sees non-null value
- **Files modified:** src/components/grading/LTPopup.tsx
- **Commit:** 72e779d

## Self-Check: PASSED

All created files and commits verified on disk.
