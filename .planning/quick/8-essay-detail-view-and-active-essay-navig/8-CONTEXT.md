# Quick Task 8: Essay detail view and active essay navigation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Task Boundary

Click history essay card to view its grading results on a dedicated page. Home tab returns to active essay in progress. Essay state persists across navigation.

</domain>

<decisions>
## Implementation Decisions

### Routing
- Separate route `/history/:id` for viewing past essay results (read-only)
- `/grade` always shows the active essay editor / current grading session

### Essay Detail Page
- Full grading results: same split-pane layout as after grading (essay panel + feedback panel with highlights)
- Read-only — no regrade or edit buttons

### Active Essay Indicator
- Small green dot on the Home/Grade nav item when essayText is non-empty
- Provides visual cue that there's work in progress

### Claude's Discretion
- Implementation details for fetching history item by ID (already exists: `getHistoryItem(id)`)
- Layout reuse strategy for results display

</decisions>

<specifics>
## Specific Ideas

- EssaysPage card click → navigate to `/history/:id` instead of fetching + navigating to `/grade`
- New `EssayDetailPage` component at `/history/:id` that fetches via `getHistoryItem(id)` and displays results
- Reuse existing `EssayPanel`, `FeedbackPanel`, `ColorLegend`, `HighlightProvider` from grading page
- Header nav "Grade" item gets conditional green dot based on `useAppStore(s => s.essayText)`

</specifics>
