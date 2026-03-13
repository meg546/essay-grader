# Quick Task 15: Implement Grammarly-like popup for LanguageTool suggestions - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Task Boundary

Implement a Grammarly-like popup that appears when users click on LanguageTool-underlined text in the Tiptap editor. The popup shows the error category, message, and clickable replacement suggestions that auto-apply.

</domain>

<decisions>
## Implementation Decisions

### Popup trigger & positioning
- **Click only** — user clicks on an underlined word/phrase to open the popup
- Popup anchors directly below the underlined text
- Closes on click outside or Esc key

### Popup content & actions
- Show error category badge (colored dot: red for spelling, blue for grammar, amber for style)
- Show error message from LanguageTool
- Show clickable replacement chips (max ~5 suggestions)
- Clicking a chip auto-replaces the underlined text in the editor
- "Dismiss" button removes the underline decoration for this match
- Close button (×) closes popup without action

### Visual design
- Floating card style using shadcn aesthetic
- Rounded corners, shadow-md
- Warm cream color scheme matching existing app theme
- Category dot colored by error type (misspelling=red, grammar=blue, style=amber)
- No animation/transition — appears immediately on click

### Claude's Discretion
- Implementation approach (ProseMirror plugin vs React component with portal)
- Max number of suggestion chips to display
- Popup z-index and overflow handling

</decisions>

<specifics>
## Specific Ideas

- Data is already available: decorations store `data-lt-message` and `data-lt-replacements` as attributes
- Current CSS classes: `.lt-misspelling` (red), `.lt-grammar` (blue), `.lt-style` (amber)
- Editor is in `EssayInput.tsx` using `@tiptap/react` with `EditorContent`
- Replacement should use ProseMirror transaction to replace the text range

</specifics>
