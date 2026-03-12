# Feature Research

**Domain:** Live essay feedback — inline grammar/spelling checking, structural essay analysis, writing productivity tools in an educational writing editor
**Researched:** 2026-03-12
**Confidence:** HIGH (LanguageTool API documented; Tiptap integration patterns verified via official GitHub; UX patterns confirmed from Grammarly/QuillBot analysis; heuristics from academic writing guidelines)

## Context

This research covers ONLY the v2.2 milestone: replacing the plain `<textarea>` with a Tiptap-based editor that provides real-time feedback as students write. The existing grading pipeline (submit essay → LLM → results with highlighting) is already built. New features must integrate cleanly with the existing `GradingPage` component structure.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users expect from any inline writing feedback tool. Missing these makes the editor feel broken or unpolished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Red/yellow underlines for grammar and spelling errors** | Grammarly, browser spell check, Google Docs — all use underlines. Users scan for underlines when proofreading. | MEDIUM | LanguageTool returns match offsets; Tiptap decorations render underlines via CSS. Color convention: red = spelling, yellow = grammar/style |
| **Click-to-fix suggestion popover** | Industry standard since Grammarly. Users expect to click an underline and get replacement options in a popup. | MEDIUM | Tiptap BubbleMenu or custom popover positioned at cursor. Show match message, replacement(s), and a dismiss option. One-click replacement via `editor.commands.replaceText()` |
| **Debounced checking (not on every keystroke)** | Users are actively typing — mid-word underlines would be jarring. All major tools delay until the user pauses. | LOW | 2-3 second debounce on `editor.on('update')`. 3s chosen per PROJECT.md to respect LanguageTool free tier (20 req/min). Cancel pending request on new input. |
| **Toggle to enable/disable live feedback** | Writers need a distraction-free mode. Grammarly has a "Set Goals" panel; most editors have a toggle. Without one, users with anxiety around writing find the red underlines actively harmful. | LOW | Single toolbar button with on/off state stored in component state (or Zustand). When toggled off, clear all decorations immediately. |
| **Word count display** | Every essay grading tool shows word count. Students have word count requirements and check constantly. Currently the plain textarea already shows this. | LOW | Tiptap `editor.storage.characterCount.words()` via `@tiptap/extension-character-count`. Display inline near editor bottom or in toolbar. |
| **Preserve existing essay text on editor mount** | Users paste in their essay before submitting. The editor replacement must not lose or scramble text already in the textarea. | LOW | Initialize Tiptap with `content: existingText`. Plain text only (no rich text formatting). Sync editor content back to the parent component's state that gets submitted. |
| **Error count summary** | Users want to know "how many issues are there" at a glance. Grammarly shows a count badge. | LOW | Count active LanguageTool matches. Display as "X issues" near toggle. Update reactively as user accepts suggestions. |

### Differentiators (Competitive Advantage)

Features that go beyond basic spell-check and align with the educational essay-grading context of this product.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Client-side structural essay heuristics (info banners)** | Most grammar tools only check language mechanics. Structural analysis (thesis, paragraph structure, conclusion) is directly relevant to rubric-aligned grading — this bridges pre-submission writing with the post-submission grading results. | MEDIUM | Client-side only — no API call needed. Analyze plain text via regex and string heuristics: paragraph count, first/last paragraph length ratio, signal phrases ("In conclusion", "I argue that", "For example"). Render as dismissible banners or a sidebar panel, NOT as inline underlines (keep structural feedback visually separate from LanguageTool underlines). |
| **Writing timer** | Replaces History toolbar button per PROJECT.md. Students writing timed essays need a visible elapsed timer. Shows time-on-task, which is also useful metadata for the teacher/student. | LOW | Simple `setInterval` counter starting on first keystroke (or on mount). Display as `MM:SS` in toolbar. No Pomodoro complexity — just elapsed time. Reset on new essay session. |
| **Structural feedback: thesis signal detection** | Students frequently omit a thesis. A banner saying "No thesis statement detected in first paragraph" before submission prevents the most common rubric failure. | LOW | Heuristic: scan first paragraph for claim-like language. Signal phrases: "I argue", "This essay will", "The purpose of", "In my opinion", "Therefore", "This shows that". No thesis signal + first paragraph present = show banner. |
| **Structural feedback: paragraph count and balance** | Short essays with single wall-of-text paragraphs score poorly on Organization rubric criteria. A "You have 1 paragraph — consider adding paragraph breaks" nudge is low-effort and high-impact. | LOW | Count `\n\n` or `\n` paragraph breaks. Flag if < 3 paragraphs for essays > 200 words. Flag if any single paragraph exceeds 60% of total word count. |
| **Structural feedback: conclusion signal detection** | Missing conclusions are a top rubric failure. Signal phrases: "In conclusion", "To summarize", "In summary", "Overall", "As I have shown". | LOW | Scan last paragraph for these phrases. If not found and essay > 150 words, show soft banner. |
| **Structural feedback: evidence/support signals** | Essays that make claims without evidence (quotes, data references, "According to", "For example", "Research shows") score lower on evidence criteria in most rubrics. | LOW | Count evidence signal phrases. If 0 found in an essay > 300 words, show an advisory banner. |

### Anti-Features (Commonly Requested, Often Problematic)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Auto-correct (apply fix without user confirmation)** | Seems like a convenience shortcut | Silently modifies the student's voice and word choice. In an academic context this is academically dishonest — the student loses ownership of their own writing. Teachers detecting unnatural phrasing patterns will flag it. | Always require explicit click-to-accept. Never auto-apply. |
| **Rich text formatting (bold, italic, headers)** | Users are used to word processors | Per PROJECT.md, editor must be plain text only. Rich text would break the existing essay text pipeline — the backend expects plain text, and the existing highlight system works on character offsets in plain text. Bold/italic would introduce HTML that shifts character counts unpredictably. | Plain text Tiptap configuration. Disable all formatting extensions. Intercept paste events to strip HTML. |
| **LLM-powered inline suggestions in the editor** | Would give richer, context-aware feedback per sentence | Requires an LLM API call per sentence update — prohibitively slow, costly, and complex for a real-time editor experience. This also duplicates the existing post-submission grading LLM pipeline. | Explicitly deferred to a future milestone per PROJECT.md. Heuristics are fast and free; LLM feedback is available after submission. |
| **Custom dictionary / user ignore list** | Power users want to add domain-specific vocabulary | Adds persistent user preferences storage, UI to manage the list, and API changes. Disproportionate complexity for a demo/course project. LanguageTool's "Ignore" already handles the single-session case. | Single-session "Ignore this suggestion" (dismiss individual LanguageTool match) without persistence. Out of scope per PROJECT.md. |
| **Character-level inline comments** | Comment threads like Google Docs | Per PROJECT.md, passage-level highlighting via the grading system is sufficient. Editor comments would create a separate comment thread that competes visually with both the LanguageTool underlines AND the existing post-grade highlight system. | Keep the two feedback systems visually distinct: LanguageTool = underlines in editor pre-submission; rubric feedback = highlighted passages in results view post-submission. |
| **Pomodoro / break timer** | Productivity apps often offer this | Adds complexity and state management for a feature tangential to essay grading. Students want a stopwatch, not a behavior modification tool. | Simple elapsed time counter (writing timer). |
| **Real-time word-count goal progress bar** | Some writing sprint tools show this | Students in an essay grading tool care about rubric compliance, not gamified word sprints. A progress bar toward a word count target adds visual noise with minimal grading value. | Static word count display. |

---

## Feature Dependencies

```
Tiptap editor (replaces <textarea>)
  -> Plain text configuration (no rich text extensions)
    -> Paste handler (strip HTML from paste)
      -> Word count display (character-count extension)
      -> LanguageTool integration
        -> Debounced editor.on('update') handler
          -> LanguageTool API call (api.languagetool.org)
            -> Decoration marks on matched ranges
              -> Click-to-fix popover (BubbleMenu or positioned div)
                -> acceptSuggestion() command
                -> dismissSuggestion() command
        -> Toggle (enable/disable)
          -> When off: clear all decorations immediately
          -> Error count display (reactive to match count)
      -> Structural heuristics (client-side, no API)
        -> Runs on editor.on('update') (separate debounce, shorter — 1s is fine)
          -> Thesis banner
          -> Paragraph count/balance banner
          -> Conclusion banner
          -> Evidence signals banner
      -> Writing timer
        -> Start on first editor keystroke
        -> Increment via setInterval
        -> Display in toolbar

Parent component integration (GradingPage)
  -> editor.getText() replaces textarea value
  -> Submit button reads from Tiptap, not textarea
  -> After grading results load: editor becomes read-only (or remains editable for resubmit)
```

### Dependency Notes

- **Tiptap requires plain text config:** Rich text extensions (Bold, Italic, Heading) must be omitted entirely — not just hidden. If included, they will be triggered by keyboard shortcuts and break the character-offset pipeline.
- **LanguageTool toggle must clear decorations immediately:** Leaving stale underlines when feedback is disabled breaks the "clean editor" expectation. Tiptap decorations must be cleared via a transaction on toggle-off.
- **Structural heuristics depend on Tiptap (not the old textarea):** They need `editor.getText()` to get the current content. This is only possible after Tiptap replaces the textarea.
- **Writing timer does not depend on LanguageTool:** They are independent features that share the toolbar. The timer should work even if feedback is toggled off.
- **Submit handler must be updated:** The existing `GradingPage` submits `essayText` state from a controlled `<textarea>`. After Tiptap migration, `essayText` must be populated from `editor.getText()` via an `onUpdate` callback or read at submit time.

---

## MVP Definition

### Launch With (v2.2)

Minimum viable feature set for this milestone as specified in PROJECT.md.

- [ ] **Tiptap editor replacing textarea** — core dependency of everything else; plain text only
- [ ] **LanguageTool integration with inline underlines** — the primary value prop of the milestone
- [ ] **Click-to-fix suggestion popover** — without this, users can see issues but cannot act on them
- [ ] **3-second debounce** — required to stay within LanguageTool free tier limits
- [ ] **Toggle to enable/disable feedback** — required; always-on underlines are disruptive during first draft
- [ ] **Word count display** — already existed in old textarea; must not regress
- [ ] **Writing timer** — explicitly listed in PROJECT.md as replacing History toolbar button
- [ ] **Structural heuristics (thesis, paragraph, conclusion, evidence)** — explicitly listed in PROJECT.md

### Add After Validation (v2.x)

- [ ] **Error count badge** — nice quality signal; add once the underline/popover flow is solid
- [ ] **Structural heuristic refinement** — tune signal phrases based on real student essay testing; false positive rate unknown until tested

### Future Consideration (v3+)

- [ ] **LLM-powered inline suggestions** — explicitly deferred per PROJECT.md; requires separate LLM infrastructure
- [ ] **Grade-level calibrated LanguageTool rules** — LanguageTool premium offers rule customization; not available on free tier
- [ ] **Custom ignore list / personal dictionary** — explicitly out of scope per PROJECT.md

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Tiptap editor replacing textarea | HIGH | MEDIUM | P1 |
| LanguageTool inline underlines | HIGH | MEDIUM | P1 |
| Click-to-fix popover | HIGH | MEDIUM | P1 |
| Debounce (3s) | HIGH | LOW | P1 |
| Toggle enable/disable | HIGH | LOW | P1 |
| Word count display | MEDIUM | LOW | P1 |
| Writing timer | MEDIUM | LOW | P1 |
| Thesis detection banner | MEDIUM | LOW | P1 |
| Paragraph count/balance banner | MEDIUM | LOW | P1 |
| Conclusion detection banner | MEDIUM | LOW | P1 |
| Evidence signals banner | MEDIUM | LOW | P1 |
| Error count summary | LOW | LOW | P2 |
| Structural heuristic tuning | LOW | LOW | P2 |
| LLM-powered suggestions | HIGH | VERY HIGH | P3 |
| Grade-level rule calibration | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v2.2 launch
- P2: Should have, add when P1 is solid
- P3: Future milestone

---

## Competitor Feature Analysis

| Feature | Grammarly | QuillBot | Hemingway App | Our Approach |
|---------|-----------|----------|----------------|--------------|
| Inline underlines | Red (spelling), green (grammar), blue (style) | Yellow (all issues) | Color-coded sentence highlighting | Red/yellow underlines via Tiptap decorations |
| Click-to-fix | Popover with one-click replacement | Popover with replacement options | No inline fix — sidebar only | BubbleMenu or positioned popover |
| Structural analysis | Premium only (Goals panel) | Essay checker post-paste | Always-on sentence-level analysis | Heuristic banners — pre-submission, client-side |
| Toggle | Per-category settings panel | Not applicable (single check on paste) | No toggle — always on | Single toolbar toggle (on/off) |
| Word count | Yes, toolbar | Yes | Yes | Via character-count extension |
| Writing timer | No | No | No | Elapsed timer — differentiator |
| API | Proprietary, cloud-only | Proprietary, cloud-only | None (client-side) | LanguageTool free tier (open, self-hostable) |
| Plain text mode | No (full rich text) | Full rich text | Markdown | Tiptap in plain-text-only config |

---

## Implementation Notes

### LanguageTool API Constraints

- **Free tier endpoint:** `https://api.languagetool.org/v2/check`
- **Rate limit:** 20 requests/minute per IP, 75,000 characters/minute, 20,000 characters/request
- **Auto language detection:** Send `language: auto` — avoids needing user language config
- **For a student essay:** At 3s debounce, peak rate is ~20 req/min, which exactly hits the limit. In practice students pause more, so average rate is lower. If rate limit is hit, silently skip the check (do not show error to user).
- **Self-host option:** LanguageTool is open source. For production use, run a self-hosted instance to remove rate limits. For demo/course project, the public API is sufficient.

### Tiptap Extension: tiptap-languagetool

The community extension `sereneinserenade/tiptap-languagetool` provides the Tiptap integration layer. Key facts:
- Uses Tiptap decorations to render underlines without modifying the document
- Stores matches in `editor.extensionStorage.languagetool.match`
- Exposes a `proofread()` command for manual triggering
- Has `automaticMode` option (set to `false` and trigger manually via debounce for rate limit control)
- No built-in UI — the popover must be implemented separately (Tiptap BubbleMenu or custom positioned component)
- TypeScript and JavaScript versions available; copy the extension file into the project rather than installing via npm (the npm package may be stale)

### Structural Heuristics: What Works

Based on academic writing guidelines (thesis in last sentence of intro, introduction = ~10% of word count, evidence phrases, conclusion phrases):

- **Thesis detection:** Scan first paragraph (up to first `\n\n`) for phrases: `I argue`, `This essay`, `The purpose`, `In my opinion`, `This paper`, `I will`, `I believe`, `The following`. Absence of these + essay > 100 words = suggest adding thesis signal. Confidence: MEDIUM (false positive risk if student writes a strong implicit thesis).
- **Paragraph balance:** `essay.split(/\n\n+/)` gives paragraphs. Flag if count < 3 for essays > 200 words. Flag if any paragraph is > 60% of total word count. Confidence: HIGH (purely structural, low false positive risk).
- **Conclusion:** Check last paragraph for: `In conclusion`, `To summarize`, `In summary`, `Overall`, `As I have shown`, `As discussed`. Confidence: MEDIUM (students often write conclusions without these exact phrases).
- **Evidence:** Search entire essay for: `For example`, `According to`, `Research shows`, `Studies show`, `For instance`, `This is shown by`, `As stated in`. Zero hits + essay > 300 words = suggest adding evidence. Confidence: MEDIUM.

All heuristics should render as **dismissible info banners** (not blocking, not inline underlines) to avoid confusion with LanguageTool error underlines. Tone should be advisory ("Consider adding...") not prescriptive ("You must...").

---

## Sources

- [LanguageTool HTTP API — Official](https://languagetool.org/http-api/) — HIGH confidence
- [LanguageTool API Rate Limits — Help Center](https://help.languagetool.org/en/articles/307929-does-languagetool-offer-an-api) — HIGH confidence
- [tiptap-languagetool Extension — GitHub](https://github.com/sereneinserenade/tiptap-languagetool) — HIGH confidence (official source)
- [Tiptap Official Documentation](https://tiptap.dev/) — HIGH confidence
- [Grammarly Editor User Guide](https://support.grammarly.com/hc/en-us/articles/360003474732-Grammarly-Editor-user-guide) — HIGH confidence (UX pattern reference)
- [QuillBot Free Essay Checker](https://quillbot.com/essay-checker) — MEDIUM confidence (competitor UX reference)
- [Essay Structure Guidelines — Swansea University](https://www.swansea.ac.uk/academic-success/academic-skills-lab/academic_writing_articles/essay-structure/structure-your-essays/) — HIGH confidence (academic writing standard)
- [Thesis Statement Length and Placement — Word Counter](https://wordcounter.io/blog/whats-a-good-word-count-for-a-thesis-statement) — MEDIUM confidence
- [SprintWrite Writing Sprint Timer — Chrome Web Store](https://chromewebstore.google.com/detail/sprintwrite/gcpkilhgmkcfiibhgfdagelbcgppiafd) — MEDIUM confidence (writing timer UX reference)

---
*Feature research for: Live Essay Feedback (v2.2 milestone — Tiptap editor, LanguageTool, structural heuristics)*
*Researched: 2026-03-12*
