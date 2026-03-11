---
phase: quick-13
plan: "01"
subsystem: essays-ui
tags: [dropdown-menu, delete, optimistic-update, shadcn]
dependency_graph:
  requires: []
  provides: [essay-card-delete-action]
  affects: [EssaysPage, history-api]
tech_stack:
  added: [shadcn/dropdown-menu]
  patterns: [optimistic-update, toast-feedback, group-hover-reveal]
key_files:
  created:
    - src/components/ui/dropdown-menu.tsx
  modified:
    - src/api/history.ts
    - src/pages/EssaysPage.tsx
decisions:
  - Wrap each card in a `div.group.relative` instead of making the Link relative, so the DropdownMenu trigger sits outside the Link click area cleanly
  - Use `onSelect` (not `onClick`) on DropdownMenuItem to get the native Event for stopPropagation
  - Restore sorted order when rolling back optimistic delete on error
metrics:
  duration: "~1 min"
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_changed: 3
---

# Quick Task 13: Add Dot Menu with Delete Option for Each Essay Card Summary

**One-liner:** Three-dot ellipsis menu on each essay card with optimistic delete, toast feedback, and no-navigation guard using shadcn DropdownMenu.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add dropdown-menu component and deleteHistoryItem API | d4ecf77 | src/components/ui/dropdown-menu.tsx, src/api/history.ts |
| 2 | Add dot menu with delete to each essay card | 69de1be | src/pages/EssaysPage.tsx |

## What Was Built

- Installed shadcn `dropdown-menu` component (src/components/ui/dropdown-menu.tsx)
- Added `deleteHistoryItem(id: string): Promise<void>` to src/api/history.ts calling `DELETE /api/history/{id}`
- Restructured each essay card in EssaysPage from a bare `<Link>` to a `div.group.relative` container holding both the Link and an absolutely-positioned DropdownMenu trigger
- Menu trigger (`MoreHorizontal` icon, `aria-label="Essay options"`) is hidden by default and revealed on group hover; always reachable via keyboard focus
- Delete DropdownMenuItem with `Trash2` icon and `text-destructive` styling calls `handleDelete`
- `handleDelete` performs optimistic removal, calls `deleteHistoryItem`, shows `toast.success` on success or restores the item and shows `toast.error` on failure
- `e.preventDefault()` + `e.stopPropagation()` on the trigger button prevents Link navigation when the menu is opened

## Decisions Made

- Wrapped each card in `div.group.relative` rather than adding `relative` to the `<Link>` to keep the DropdownMenu trigger cleanly outside the anchor's interactive area
- Used `onSelect` on `DropdownMenuItem` (receives a native `Event`) for `stopPropagation`, matching Radix UI's pattern
- Rollback restores sorted order (re-sorts by `gradedAt` descending) so the card reappears in its original position

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] src/components/ui/dropdown-menu.tsx exists
- [x] deleteHistoryItem exported from src/api/history.ts
- [x] EssaysPage.tsx updated with DropdownMenu, handleDelete, group/relative classes
- [x] TypeScript compiles cleanly (`npx tsc --noEmit` — no output)
- [x] Commits d4ecf77 and 69de1be exist

## Self-Check: PASSED
