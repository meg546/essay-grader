---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ui/dropdown-menu.tsx
  - src/api/history.ts
  - src/pages/EssaysPage.tsx
autonomous: true
requirements: [QUICK-13]
must_haves:
  truths:
    - "Each essay card has a three-dot menu button"
    - "Clicking the menu shows a Delete option"
    - "Clicking Delete removes the essay from the list and the database"
    - "Clicking the menu does NOT navigate to the essay detail page"
  artifacts:
    - path: "src/components/ui/dropdown-menu.tsx"
      provides: "Shadcn DropdownMenu component"
    - path: "src/api/history.ts"
      provides: "deleteHistoryItem API function"
      exports: ["getHistory", "getHistoryItem", "deleteHistoryItem"]
    - path: "src/pages/EssaysPage.tsx"
      provides: "Essays page with dot menu on each card"
  key_links:
    - from: "src/pages/EssaysPage.tsx"
      to: "src/api/history.ts"
      via: "deleteHistoryItem call on menu action"
      pattern: "deleteHistoryItem"
    - from: "src/pages/EssaysPage.tsx"
      to: "src/components/ui/dropdown-menu.tsx"
      via: "DropdownMenu component import"
      pattern: "DropdownMenu"
---

<objective>
Add a three-dot ellipsis menu to each essay card on the Essays page with a "Delete" option that removes the essay from history.

Purpose: Users need a way to delete essays from their grading history.
Output: Each essay card gets a "..." menu with Delete action that calls the existing backend DELETE endpoint and removes the card from the UI.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/pages/EssaysPage.tsx
@src/api/history.ts
@src/api/client.ts
@src/api/types.ts

<interfaces>
<!-- Backend DELETE endpoint already exists -->
Backend: DELETE /api/history/{submission_id} -> 204 No Content (auth required)

From src/api/history.ts:
```typescript
export async function getHistory(): Promise<HistoryItem[]>;
export async function getHistoryItem(id: string): Promise<GradingResult>;
```

From src/api/client.ts:
```typescript
export const apiClient: AxiosInstance; // baseURL: http://localhost:8000/api
```

From src/api/types.ts:
```typescript
export interface HistoryItem {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  categoryCount: number;
  gradedAt: string;
}
```

Toast pattern (used elsewhere):
```typescript
import { toast } from "sonner";
toast.success("Message");
toast.error("Message");
```

Shadcn CLI: `npx shadcn@latest add dropdown-menu` (style: base-nova)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dropdown-menu component and deleteHistoryItem API function</name>
  <files>src/components/ui/dropdown-menu.tsx, src/api/history.ts</files>
  <action>
1. Install shadcn dropdown-menu component:
   ```
   npx shadcn@latest add dropdown-menu
   ```
   This creates src/components/ui/dropdown-menu.tsx automatically.

2. Add deleteHistoryItem to src/api/history.ts:
   ```typescript
   export async function deleteHistoryItem(id: string): Promise<void> {
     await apiClient.delete(`/history/${id}`);
   }
   ```
   Backend already returns 204 on success, 404 if not found.
  </action>
  <verify>
    <automated>grep -q "deleteHistoryItem" src/api/history.ts && test -f src/components/ui/dropdown-menu.tsx && echo "PASS"</automated>
  </verify>
  <done>dropdown-menu.tsx exists, deleteHistoryItem exported from history.ts</done>
</task>

<task type="auto">
  <name>Task 2: Add dot menu with delete to each essay card</name>
  <files>src/pages/EssaysPage.tsx</files>
  <action>
Modify EssaysPage.tsx to add a three-dot menu to each essay card:

1. Add imports:
   - `MoreHorizontal, Trash2` from lucide-react
   - `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem` from @/components/ui/dropdown-menu
   - `deleteHistoryItem` from @/api/history
   - `toast` from sonner

2. Restructure each card in the grid. Currently each card is wrapped in a `<Link>`. Change the structure so the card itself is the Link but the menu button lives OUTSIDE the link's click area. Approach:
   - Keep the `<Link>` wrapping the card
   - Place a `<DropdownMenu>` trigger button absolutely positioned in the top-right corner of the card
   - The trigger button MUST call `e.preventDefault()` and `e.stopPropagation()` on click to prevent Link navigation
   - Use a `<button>` with `<MoreHorizontal className="h-4 w-4" />` as the trigger icon
   - Style the trigger: `absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100`
   - Add `group relative` to the parent Link or Card so hover reveals the menu button

3. DropdownMenu content:
   - Single item: `<DropdownMenuItem>` with `<Trash2 className="mr-2 h-4 w-4" />` icon and "Delete" text
   - Style the delete item with `text-destructive focus:text-destructive` classes
   - On select (use `onSelect` prop, not `onClick`), call the delete handler

4. Delete handler (async function `handleDelete(e: Event, id: string)`):
   - Call `e.stopPropagation()` to prevent navigation
   - Optimistically remove the item from `items` state: `setItems(prev => prev.filter(item => item.id !== id))`
   - Call `deleteHistoryItem(id)` in a try/catch
   - On success: `toast.success("Essay deleted")`
   - On error: restore the item back into the list (keep a ref to the removed item), `toast.error("Failed to delete essay")`

5. Add `aria-label="Essay options"` to the menu trigger button for accessibility.

6. The card's relative positioning: add `relative` class to the Link or the Card component, and `group` class so the child trigger appears on hover.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Each essay card shows a "..." button on hover, clicking it opens a dropdown with "Delete" option, clicking Delete removes the essay optimistically with toast feedback, clicking the menu does not navigate to essay detail</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `npx tsc --noEmit`
- Dev server starts without errors: `npm run dev` (manual spot check)
- Visual: hover over an essay card reveals "..." button, click opens menu, Delete option visible with red/destructive styling
</verification>

<success_criteria>
- Three-dot menu button appears on each essay card (visible on hover, always accessible via keyboard)
- Menu contains a "Delete" option with destructive styling
- Clicking Delete removes the essay from the UI immediately (optimistic) and calls the backend
- Clicking the menu trigger does NOT navigate to the essay detail page
- Toast confirms deletion success or shows error on failure
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/13-add-dot-menu-with-delete-option-for-each/13-SUMMARY.md`
</output>
