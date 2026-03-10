---
phase: quick-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/EssayDetailPage.tsx
  - src/App.tsx
  - src/pages/EssaysPage.tsx
  - src/components/layout/Header.tsx
autonomous: true
requirements: [ESSAY-DETAIL, ACTIVE-ESSAY-NAV]

must_haves:
  truths:
    - "Clicking a history essay card navigates to /history/:id and shows full grading results read-only"
    - "Grade page remains the active essay editor, unaffected by viewing history items"
    - "Green dot appears on Home nav item when essayText is non-empty"
  artifacts:
    - path: "src/pages/EssayDetailPage.tsx"
      provides: "Read-only essay detail view with split-pane results"
      min_lines: 40
    - path: "src/App.tsx"
      provides: "Route for /history/:id"
      contains: "history/:id"
  key_links:
    - from: "src/pages/EssayDetailPage.tsx"
      to: "getHistoryItem"
      via: "fetch on mount using useParams id"
      pattern: "getHistoryItem.*id"
    - from: "src/pages/EssaysPage.tsx"
      to: "/history/:id"
      via: "navigate on card click"
      pattern: "navigate.*history/"
---

<objective>
Create a dedicated essay detail page at `/history/:id` for viewing past grading results read-only, update essay card clicks to navigate there instead of polluting the grading page, and add an active-essay green dot indicator on the Home nav item.

Purpose: Separate viewing history results from the active grading session so users can browse past essays without losing their current work.
Output: New EssayDetailPage component, updated routing, updated EssaysPage navigation, Header green dot indicator.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/api/history.ts
@src/api/types.ts
@src/stores/app-store.ts

<interfaces>
From src/api/history.ts:
```typescript
export async function getHistoryItem(id: string): Promise<GradingResult>;
```

From src/api/types.ts:
```typescript
export interface GradingResult {
  id: string;
  essayText: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  summary: string;
  categories: CategoryScore[];
  gradedAt: string;
}
```

From src/stores/app-store.ts:
```typescript
export const useAppStore = create<AppState>()(persist(...));
// essayText is persisted, accessible via useAppStore(s => s.essayText)
```

From src/pages/GradingPage.tsx (results rendering pattern, lines 92-112):
```tsx
<HighlightProvider key={currentResult.id}>
  <div className="mx-auto max-w-[1400px] space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Grading Results</h1>
      <Button variant="outline" onClick={handleReset}>Grade Another</Button>
    </div>
    <ColorLegend categories={currentResult.categories} />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <EssayPanel result={currentResult} onRegrade={handleRegrade} isRegrading={isRegrading} />
      <FeedbackPanel result={currentResult} isLoading={isRegrading} />
    </div>
  </div>
</HighlightProvider>
```

From src/components/results/EssayPanel.tsx props (needs check):
- `result: GradingResult` (required)
- `onRegrade?: () => void` (optional callback)
- `isRegrading?: boolean` (optional)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create EssayDetailPage and add route</name>
  <files>src/pages/EssayDetailPage.tsx, src/App.tsx, src/pages/EssaysPage.tsx</files>
  <action>
1. Create `src/pages/EssayDetailPage.tsx`:
   - Use `useParams` to get `id` from URL
   - On mount, call `getHistoryItem(id)` to fetch the full GradingResult
   - Show a centered Loader2 spinner while loading
   - On error, show a message with a "Back to Essays" button linking to `/history`
   - On success, render the same split-pane layout as GradingPage results view:
     - Wrap in `<HighlightProvider key={result.id}>`
     - Header row with "Essay Results" title and a "Back to Essays" Button (variant="outline") that navigates to `/history`
     - `<ColorLegend categories={result.categories} />`
     - Two-column grid: `<EssayPanel result={result} />` and `<FeedbackPanel result={result} />`
   - Do NOT pass `onRegrade` or `isRegrading` to EssayPanel (read-only view, no regrade button)
   - Do NOT touch the app store -- this page is self-contained with local state only

2. Update `src/App.tsx`:
   - Import `EssayDetailPage`
   - Add route `<Route path="/history/:id" element={<EssayDetailPage />} />` inside the ProtectedRoute > Layout group, alongside the existing `/history` route

3. Update `src/pages/EssaysPage.tsx`:
   - Replace `handleCardClick` async function with a simple navigate: `navigate(\`/history/\${item.id}\`)`
   - Remove `getHistoryItem` import (no longer needed here)
   - Remove `setCurrentResult` from store usage (no longer needed here)
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>EssayDetailPage renders at /history/:id with full read-only results. Essay cards navigate to /history/:id. GradingPage is not affected.</done>
</task>

<task type="auto">
  <name>Task 2: Add active essay green dot to Home nav item</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
1. Import `useAppStore` from `@/stores/app-store`
2. In the `Header` component (not NavLinkItem), read essayText: `const essayText = useAppStore((s) => s.essayText)`
3. When mapping over `navItems`, pass a `showDot` prop to `NavLinkItem` for the Home item only: `showDot={item.to === "/grade" && essayText.trim() !== ""}`
4. Add `showDot?: boolean` to the NavLinkItem props
5. In NavLinkItem, when `showDot` is true, render a small green dot after the label text:
   ```tsx
   <span className="relative">
     {label}
     {showDot && (
       <span className="absolute -right-2 -top-0.5 h-2 w-2 rounded-full bg-green-500" />
     )}
   </span>
   ```
6. Also update the `isActive` check for `/grade` to NOT match `/history/:id` paths (currently it checks `location.pathname.startsWith("/grade")` which is fine -- just verify `/history/xxx` won't accidentally match the grade nav item)
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Green dot appears next to "Home" nav label when essayText in store is non-empty. Dot disappears when essayText is empty.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Navigate to /history page, click an essay card -- should go to /history/:id with full results displayed read-only (no regrade button)
3. Navigate to /grade -- should still show the essay editor, unaffected by history viewing
4. Type text in the essay editor, check that green dot appears on "Home" nav item
5. Clear the essay text, verify green dot disappears
</verification>

<success_criteria>
- /history/:id route exists and renders EssayDetailPage with full grading results
- Essay cards on /history navigate to /history/:id (not /grade)
- EssayDetailPage is read-only (no regrade, no grade-another resetting state)
- Green dot on Home nav when essayText is non-empty
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/8-essay-detail-view-and-active-essay-navig/8-SUMMARY.md`
</output>
