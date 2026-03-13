# Phase 20: LanguageTool Decorations - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

ProseMirror plugin that checks essay text against the LanguageTool API and renders inline wavy underlines for spelling, grammar, and style issues. Includes 3-second debounce, position mapping from LanguageTool offsets to ProseMirror positions, and rate-limit backoff. Click-to-fix popover and toolbar toggle are separate phases (21, 22).

</domain>

<decisions>
## Implementation Decisions

### Underline color coding
- Color-coded by issue type: red wavy for spelling, blue wavy for grammar, amber wavy for style
- SVG background pattern for the wavy line (not CSS `text-decoration: wavy`) — gives control over wave amplitude/thickness like Grammarly and VS Code
- Uniform opacity for all underline types — no confidence-based dimming
- Underline only, no background tint on flagged text — keeps reading flow clean

### Decoration clearing behavior
- When user types inside or near a decorated word, only that touched decoration clears immediately — other underlines stay
- When a new LanguageTool response arrives, replace entire DecorationSet at once (no diffing or animation)
- Clearing the editor (Clear button) instantly removes all decorations
- No loading indicator while waiting for LanguageTool — decorations just appear when ready

### Error & loading UX
- Rate-limit 429: silent retry with exponential backoff (10s, 20s, 40s). Existing underlines stay visible. No user-facing message.
- Service completely down: silent degradation. No underlines, no error messages. Editor continues working normally.
- No maximum essay length cap — let LanguageTool's own limits handle it

### API routing
- Try direct browser fetch to LanguageTool API first
- If CORS blocks it, automatically fall back to FastAPI backend proxy
- This avoids unnecessary backend load when direct access works

### Claude's Discretion
- Exact SVG wave pattern dimensions and rendering approach
- Exponential backoff ceiling and retry count before giving up
- Position mapping implementation details (doc.nodesBetween vs doc.resolve approach)
- Whether to batch-check or send full text on each debounce

</decisions>

<specifics>
## Specific Ideas

- Underline colors should follow Grammarly/Word conventions that students already recognize (red=spelling, blue=grammar, amber=style)
- The experience should be invisible when working correctly — no spinners, no loading states, decorations just appear naturally after the user pauses

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EssayInput.tsx`: Tiptap editor with `useEditor`, `StarterKit`, `CharacterCount` — new LanguageTool extension plugs into the same `extensions` array
- `GradingToolbar.tsx`: Has `ToolbarButton` component and existing button pattern — Phase 22's toggle button will slot in here
- `shadcn/ui Popover`: Already imported in toolbar — Phase 21's suggestion popover can reuse this

### Established Patterns
- One-way Zustand sync: `editor.getText()` → `store.setEssayText()` in `onUpdate`. LanguageTool plugin should read from editor state directly, not from Zustand
- `immediatelyRender: false` required for React 19 compatibility
- `getState().setEssayText` pattern avoids stale closures in editor callbacks

### Integration Points
- `EssayInput.tsx` line 71-107: `useEditor` config — LanguageTool extension added to `extensions` array
- `EditorContent` component (line 219-221) — decorations render automatically through ProseMirror plugin system
- No new API client exists yet — `src/api/languagetool.ts` will be created for the API layer
- FastAPI proxy endpoint will need to be added to `backend/app/routes/` if CORS fails

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-languagetool-decorations*
*Context gathered: 2026-03-13*
