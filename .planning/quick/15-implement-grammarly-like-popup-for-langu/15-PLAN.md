---
phase: 15-lt-suggestion-popup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/extensions/LanguageTool.ts
  - src/components/grading/LTPopup.tsx
  - src/components/grading/EssayInput.tsx
  - src/index.css
autonomous: true
requirements: [LT-POPUP]

must_haves:
  truths:
    - "User clicks underlined text and sees a floating card with error details"
    - "User clicks a replacement chip and the text is auto-replaced"
    - "User clicks dismiss and the underline decoration is removed"
    - "Popup closes on Esc or clicking outside"
  artifacts:
    - path: "src/components/grading/LTPopup.tsx"
      provides: "Floating suggestion popup component"
      min_lines: 80
    - path: "src/extensions/LanguageTool.ts"
      provides: "Updated decorations with from/to/issueType data attributes"
  key_links:
    - from: "src/components/grading/LTPopup.tsx"
      to: "src/extensions/LanguageTool.ts"
      via: "ltPluginKey for reading/modifying decoration state"
      pattern: "ltPluginKey"
    - from: "src/components/grading/EssayInput.tsx"
      to: "src/components/grading/LTPopup.tsx"
      via: "LTPopup rendered alongside EditorContent, receives editor prop"
      pattern: "<LTPopup"
---

<objective>
Implement a Grammarly-like floating popup that appears when users click LanguageTool-underlined text in the Tiptap editor. The popup shows the error category, message, replacement chips, and dismiss/close controls.

Purpose: Give users an actionable way to accept or dismiss LanguageTool suggestions inline.
Output: LTPopup component wired into EssayInput, with replacement and dismiss functionality.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/extensions/LanguageTool.ts
@src/components/grading/EssayInput.tsx
@src/components/ui/card.tsx
@src/index.css
@src/api/languagetool.ts

<interfaces>
<!-- From src/extensions/LanguageTool.ts -->
```typescript
export const ltPluginKey = new PluginKey<DecorationSet>('languageTool')
```

<!-- From src/api/languagetool.ts -->
```typescript
export interface LTMatch {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: Array<{ value: string }>
  rule: { id: string; issueType: string; category: { id: string; name: string } }
}
```

<!-- From src/components/ui/card.tsx -->
```typescript
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
```

<!-- Decorations currently store these attributes -->
```typescript
Decoration.inline(from, to, {
  class: cssClass,                    // lt-misspelling | lt-grammar | lt-style
  'data-lt-message': match.message,
  'data-lt-replacements': JSON.stringify(match.replacements.map(r => r.value)),
})
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend decoration attributes and create LTPopup component</name>
  <files>src/extensions/LanguageTool.ts, src/components/grading/LTPopup.tsx, src/index.css</files>
  <action>
**Step A: Update LanguageTool.ts decorations to include position and category data.**

In `buildDecorations`, add two more data attributes to each `Decoration.inline()` call:
- `'data-lt-from': String(from)` — ProseMirror start position
- `'data-lt-to': String(to)` — ProseMirror end position
- `'data-lt-category': match.rule.issueType.toLowerCase()` — for the colored category dot

Also add `cursor: pointer` style so underlined text looks clickable:
```typescript
Decoration.inline(from, to, {
  class: cssClass,
  style: 'cursor: pointer',
  'data-lt-message': match.message,
  'data-lt-replacements': JSON.stringify(match.replacements.map(r => r.value)),
  'data-lt-from': String(from),
  'data-lt-to': String(to),
  'data-lt-category': match.rule.issueType.toLowerCase(),
})
```

**Step B: Create `src/components/grading/LTPopup.tsx`.**

This is a React component that:

1. **Props:** `editor: Editor | null` (from @tiptap/react).

2. **State:** `popupData: { message, replacements, from, to, category, anchorRect } | null` — null means hidden.

3. **Click handler (attach on mount via `useEffect`):**
   - Listen for `click` on `editor.view.dom`.
   - On click, walk up from `event.target` to find an element with `data-lt-message` attribute (use `(event.target as HTMLElement).closest('[data-lt-message]')`).
   - If found: extract `data-lt-message`, `data-lt-replacements` (JSON.parse), `data-lt-from`, `data-lt-to`, `data-lt-category` from the element. Get `anchorRect` via `element.getBoundingClientRect()`. Set `popupData`.
   - If not found on a decoration: set `popupData` to null (closes popup).

4. **Close on Esc:** `useEffect` with `keydown` listener on `document`. If `event.key === 'Escape'`, set `popupData` to null.

5. **Close on click outside:** Use a ref on the popup card div. In the editor click handler above, if the click is NOT on a decoration AND NOT inside the popup ref, close. Also add a `mousedown` listener on `document` that checks if click is outside both the popup and the editor decorations — close if so.

6. **Position recalculation on scroll:** The popup should recalculate position when the editor scrolls. Add a `scroll` listener on the editor's scroll container (`editor.view.dom.closest('.overflow-y-auto')` or the EditorContent wrapper). On scroll, if popupData is open, re-query the decoration element by finding the span with matching `data-lt-from` and update `anchorRect`. If the element is no longer in view, close the popup.

7. **Replace handler:**
   ```typescript
   function handleReplace(replacement: string) {
     if (!editor || !popupData) return
     const { from, to } = popupData
     editor.chain().focus()
       .command(({ tr }) => {
         tr.replaceWith(from, to, editor.state.schema.text(replacement))
         return true
       })
       .run()
     setPopupData(null)
   }
   ```

8. **Dismiss handler:** Remove the decoration for this match without changing text.
   ```typescript
   function handleDismiss() {
     if (!editor || !popupData) return
     const { from, to } = popupData
     const pluginState = ltPluginKey.getState(editor.state)
     if (pluginState) {
       const decos = pluginState.find(from, to)
       const newSet = pluginState.remove(decos)
       editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, newSet))
     }
     setPopupData(null)
   }
   ```

9. **Render:** When `popupData` is null, render nothing. Otherwise render a fixed-position div using `anchorRect` to position below the underlined text:
   ```
   top: anchorRect.bottom + 4 (4px gap)
   left: anchorRect.left
   ```
   Use a portal (`createPortal` to `document.body`) so it's not clipped by overflow.

   Card content structure:
   ```
   <div className="fixed z-50 ...">  <!-- portal to body -->
     <Card size="sm" className="shadow-md w-72">
       <CardHeader className="pb-1 pt-2 px-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className={categoryDotClass} />  <!-- 8px colored dot -->
             <span className="text-xs font-medium text-muted-foreground capitalize">{categoryLabel}</span>
           </div>
           <button onClick={() => setPopupData(null)} className="..." aria-label="Close">
             <X className="h-3.5 w-3.5" />
           </button>
         </div>
       </CardHeader>
       <CardContent className="px-3 pb-2">
         <p className="text-sm mb-2">{popupData.message}</p>
         <div className="flex flex-wrap gap-1.5">
           {replacements.slice(0, 5).map(r => (
             <button key={r} onClick={() => handleReplace(r)} className="replacement chip styles">
               {r}
             </button>
           ))}
         </div>
       </CardContent>
       <CardFooter className="px-3 py-1.5 justify-end">
         <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-foreground">
           Dismiss
         </button>
       </CardFooter>
     </Card>
   </div>
   ```

   Category dot colors (matching existing CSS classes):
   - misspelling/typographical: `bg-red-500`
   - grammar/duplication/inconsistency: `bg-blue-500`
   - style/locale-violation/register/formatting: `bg-amber-500`
   - default: `bg-blue-500`

   Category label: Map issueType to a readable label ("Spelling", "Grammar", "Style").

   Replacement chips: `rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer`

   Import X icon from `lucide-react`.

**Step C: Add CSS for `.lt-misspelling`, `.lt-grammar`, `.lt-style` cursor pointer.**

In `src/index.css`, add `cursor: pointer` to all three LT classes (belt-and-suspenders with inline style from Step A):
```css
.lt-misspelling, .lt-grammar, .lt-style {
  cursor: pointer;
}
```
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>LTPopup component exists with click-to-open, replacement, dismiss, and close functionality. Decorations carry position and category data. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Wire LTPopup into EssayInput</name>
  <files>src/components/grading/EssayInput.tsx</files>
  <action>
In `EssayInput.tsx`:

1. Import `LTPopup` from `@/components/grading/LTPopup`.
2. After the `<EditorContent ... />` element (inside the wrapper div), add `<LTPopup editor={editor} />`.

That is the only change. The LTPopup component handles all its own event listeners and portaling internally.

```tsx
<EditorContent
  editor={editor}
  className="..."
/>
<LTPopup editor={editor} />
<input ref={fileInputRef} ... />
```
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>LTPopup renders alongside EditorContent, build succeeds with no errors. Clicking an underlined word in the editor shows the popup; clicking a chip replaces text; dismiss removes the underline; Esc and click-outside close the popup.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run build` succeeds
3. Manual test: Open grading page, paste text with errors (e.g., "Ths is a tset sentnce."), wait for underlines to appear (~3s), click an underlined word — popup should appear below it with error message and replacement chips. Click a chip to replace. Click dismiss on another error to remove underline. Press Esc to close without action. Click outside to close.
</verification>

<success_criteria>
- Clicking underlined text shows a floating card popup with: colored category dot, error message, up to 5 replacement chips, dismiss button, close button
- Clicking a replacement chip replaces the underlined text in the editor via ProseMirror transaction
- Clicking dismiss removes the decoration without changing text
- Popup closes on Esc key or clicking outside
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/15-implement-grammarly-like-popup-for-langu/15-SUMMARY.md`
</output>
