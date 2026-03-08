# Pitfalls Research

**Domain:** AI Essay Grading Frontend (React/TypeScript, mock-first, education)
**Researched:** 2026-03-08
**Confidence:** MEDIUM (domain experience + training data; WebSearch unavailable for verification)

## Critical Pitfalls

### Pitfall 1: Mock Data That Lies About the Real API Shape

**What goes wrong:**
Mock data returns perfectly structured, predictable responses (e.g., every rubric category always has exactly 3 strengths, feedback is always 2 sentences, scores are always integers). When the real FastAPI backend is integrated, the frontend breaks because real LLM output is messy: variable-length feedback, unexpected nulls, scores that are floats instead of ints, categories the model skips or hallucinates.

**Why it happens:**
Developers write mocks that make the UI look good rather than mocks that simulate realistic AI output variability. The mock becomes a specification of an idealized API rather than a simulation of the real one.

**How to avoid:**
- Define TypeScript interfaces for API responses FIRST, then derive mocks from those interfaces
- Include edge cases in mock data: empty feedback strings, very long feedback (500+ words), missing categories, scores at boundaries (0 and max)
- Create at least 3 mock response variants per endpoint: best-case, typical-case, edge-case
- Make the mock service function signatures match the planned FastAPI OpenAPI spec exactly (request/response shapes, error codes)
- Use `z.infer` from Zod or similar to share validation between mock and future real responses

**Warning signs:**
- All mock responses have identical structure lengths
- No error states in mock data
- UI only tested with "happy path" data
- TypeScript types defined inline in components rather than in a shared API types file

**Phase to address:**
Phase 1 (Project Setup / API Layer). The typed API contract and mock data design must happen before any UI work begins. Retrofitting realistic mocks is painful.

---

### Pitfall 2: Rubric Editor State Becomes Unmanageable

**What goes wrong:**
The editable rubric (add/remove categories, adjust max scores, reset to defaults) creates deeply nested mutable state. Developers either put it all in component-local state (losing it on navigation) or create a Zustand store with overly complex nested update logic. The rubric state then gets out of sync between the editor, the submission payload, and the results display.

**Why it happens:**
Rubric state is the most complex data in this app: it is user-editable, it defines the structure of API requests AND responses, and it must persist across the submit-to-results flow. Treating it as "just another form" leads to a tangle.

**How to avoid:**
- Define a single canonical `Rubric` type used everywhere: editor, submission, results
- Store rubric in Zustand with normalized structure (categories as a record keyed by ID, separate ordered ID array) rather than a plain array
- Use immutable update patterns (spread or Immer) -- Zustand supports Immer middleware
- Rubric validation happens at the store level, not in UI components
- Reset-to-default is a store action that replaces the entire rubric, not individual field resets

**Warning signs:**
- Rubric category IDs are array indices instead of stable identifiers
- Components directly mutate rubric state instead of dispatching store actions
- Rubric shape differs between what the editor produces and what the submit function expects
- "Reset to default" only partially resets (some fields survive)

**Phase to address:**
Phase 2 (Core Features -- Essay Input + Rubric). The rubric data model and Zustand store must be designed before building the rubric editor UI.

---

### Pitfall 3: Results Page Is Unusable for Actual Grading Review

**What goes wrong:**
The results page shows scores and feedback but is designed as a "dashboard" rather than a "grading review tool." Instructors need to cross-reference feedback against the original essay text, but the results page shows feedback in isolation. The instructor has to mentally context-switch between "what did the AI say about Organization?" and "what did the student actually write?" without being able to see both.

**Why it happens:**
Developers focus on displaying AI output prettily (score bars, collapsible sections) without considering the instructor workflow: read feedback, verify against essay, potentially disagree and adjust. The essay text disappears after submission.

**How to avoid:**
- Keep the submitted essay text accessible from the results page (expandable panel, side-by-side view, or a "View Essay" tab)
- Design the results layout so feedback and essay can be cross-referenced without page navigation
- Even for MVP, include the essay text in the results data structure so it is available for display later

**Warning signs:**
- Results page component does not receive or have access to the original essay text
- No way to get back to the essay from the results page without browser back button
- Results data model only stores scores/feedback, not the input essay

**Phase to address:**
Phase 3 (Results Display). Must be considered during data model design in Phase 2 (store the essay with results), but the UI addresses it in Phase 3.

---

### Pitfall 4: File Upload Handling That Breaks on Real PDFs

**What goes wrong:**
PDF upload is listed as a requirement (.txt, .pdf). Developers add a file input, read the file, and assume `FileReader.readAsText()` works for PDFs. It does not -- PDFs are binary and require a parsing library. The result is garbled text or an empty string, and this is not caught until someone actually uploads a PDF.

**Why it happens:**
Text files work trivially with the FileReader API. Developers assume PDFs are similar or defer the problem. PDF parsing in the browser requires a library like pdf.js, which adds complexity and bundle size.

**How to avoid:**
- Use `pdfjs-dist` (Mozilla's pdf.js) for client-side PDF text extraction
- Handle PDF parsing failures gracefully: corrupted files, scanned-image PDFs (no extractable text), password-protected PDFs
- Show a clear error message when text extraction fails rather than silently submitting empty content
- Add a character/word count that updates after extraction so the instructor can verify the text was read correctly
- Consider a "preview extracted text" step before submission

**Warning signs:**
- File upload only tested with .txt files
- No PDF parsing library in package.json
- No error handling for file read failures
- Word count does not update after file upload

**Phase to address:**
Phase 2 (Core Features -- Essay Input). Must be handled when building the essay input component. Do not defer PDF parsing to "later."

---

### Pitfall 5: Scoring Visualization That Misrepresents AI Confidence

**What goes wrong:**
Score bars with green/yellow/red color coding imply precision and certainty that AI essay grading does not have. A score of 4/6 displayed as a solid green bar suggests the AI is confident and correct. Instructors either over-trust the scores (defeating the purpose of human review) or distrust the entire tool when they see a score they disagree with (because the UI presented it as definitive).

**Why it happens:**
Developers default to progress-bar patterns from dashboards. These work for factual metrics (CPU usage, download progress) but misrepresent probabilistic AI assessments.

**How to avoid:**
- Pair every score with its justification text visually (not hidden behind a collapse)
- Consider softer visual language: "Suggested score: 4/6" rather than just "4/6" with a bar
- Use the color coding for relative comparison (low/medium/high within the rubric) rather than implying absolute quality
- Include a brief disclaimer or framing text: "AI-suggested scores for instructor review"
- The overall summary should frame results as suggestions, not verdicts

**Warning signs:**
- Score display has no qualifying language ("suggested," "estimated")
- Score justification is hidden by default (collapsed) while the score itself is prominent
- No visual distinction between AI-generated scores and hypothetical instructor-confirmed scores
- Color thresholds are hardcoded without considering different rubric scales

**Phase to address:**
Phase 3 (Results Display). This is a design decision that must be made when building score visualization components.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding mock data inline in API functions | Fast to write, easy to see | Cannot test edge cases, hard to swap for real API, no response variability | Never -- put mocks in separate data files from day one |
| Using `any` types for API responses | Avoids upfront type design | Loses TypeScript's main value; bugs surface at runtime when backend integrates | Never -- define response types before building UI |
| Storing rubric as untyped JSON blob | Flexible, no schema to maintain | Validation bugs, silent data corruption, impossible to refactor | Never -- Zod schema or equivalent from the start |
| Skipping loading/error states in mock mode | Mocks return instantly, no visible need | When real API is slow or fails, UI has no handling; must retrofit everywhere | Only in earliest prototype; add simulated delays immediately |
| Single mock response per endpoint | Quick to implement | UI only works for one scenario; integration reveals layout breaks | Only for initial scaffold; add variants before UI is "done" |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| FastAPI backend swap | Mock functions have different signatures than real API endpoints | Define API contract (OpenAPI spec or TypeScript interfaces) first; mock functions must accept the same params and return the same shape |
| PDF file upload | Using `readAsText()` for PDFs | Use `pdfjs-dist` for PDF text extraction; handle binary format properly |
| Axios HTTP client | Importing Axios but only using it with mock interceptors | Create a configured Axios instance with baseURL, interceptors, and error transforms; mock at the function level above Axios, not with Axios interceptors |
| File upload to backend | Sending file as base64 string | Plan for `multipart/form-data` upload; mock the file-to-text extraction on frontend, but design for server-side extraction later |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire results page on any state change | Visible jank when expanding/collapsing feedback sections | Memoize score bar and feedback components; use separate Zustand selectors per section | With 8+ rubric categories and long feedback text |
| Storing full essay text in multiple Zustand slices | Memory bloat, stale copies | Store essay text once; reference by ID from results | With essays over 5000 words |
| Unoptimized PDF.js bundle import | 500KB+ added to initial bundle | Dynamic import `pdfjs-dist` only when user selects a PDF file | Immediately on first load (affects Lighthouse score) |
| Submission history storing full response data in memory | Slow list rendering, high memory | Store summaries in list; load full results on demand (even from mock) | With 20+ history entries with long feedback |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback while "grading" is in progress | Instructor thinks app is frozen; clicks submit again | Show animated progress with stage indicators ("Analyzing essay...", "Scoring rubric categories...", "Generating feedback...") even if simulated |
| Rubric editor has no validation feedback | Instructor submits with empty category names or 0 max scores; gets confusing results | Inline validation: highlight empty fields, prevent submit with invalid rubric, show category count |
| Results page requires scrolling past scores to see feedback | Instructor misses detailed feedback; only sees numbers | Put overall summary at top, then interleaved score+feedback per category, not scores-then-feedback |
| No confirmation before leaving unsaved rubric edits | Instructor loses custom rubric by accidentally navigating away | Use `beforeunload` event and React Router's navigation blocking when rubric has unsaved changes |
| History table shows no preview of results | Instructor cannot distinguish between submissions without clicking each one | Show essay title/first line, date, and aggregate score in the table row |
| Color-coded scores ignore different max scales | Category with max 3 and category with max 6 have same color thresholds | Calculate color thresholds as percentage of max score, not absolute values |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Essay Input:** Often missing max-length validation -- verify that very long essays (10,000+ words) do not crash the textarea or browser tab
- [ ] **File Upload:** Often missing PDF support -- verify a real PDF file (not just .txt renamed to .pdf) extracts text correctly
- [ ] **Rubric Editor:** Often missing edge cases -- verify behavior with 1 category, 10 categories, and a category with max score of 1
- [ ] **Submit Flow:** Often missing error state -- verify what happens when the (mock) API "fails" (network error, server error, timeout)
- [ ] **Results Page:** Often missing the original essay -- verify the instructor can view the submitted essay alongside feedback
- [ ] **Score Bars:** Often missing responsive behavior -- verify score bars render correctly on tablet widths (768px)
- [ ] **History Page:** Often missing empty state -- verify what the page shows when there are zero submissions
- [ ] **Navigation:** Often missing loading state persistence -- verify that navigating away from results and back preserves data (does not re-trigger "grading")
- [ ] **Rubric Reset:** Often missing confirmation -- verify that "reset to default" asks for confirmation and actually resets ALL fields

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mock data shape mismatch with real API | MEDIUM | Add Zod validation layer between API and components; fix types; update mocks to match real responses |
| Rubric state management tangle | HIGH | Extract rubric into its own Zustand slice with normalized state; update all consumers; this is essentially a rewrite of state layer |
| PDF upload not working | LOW | Add `pdfjs-dist`, create a `parsePdf()` utility, wire into existing file upload handler |
| Results page missing essay context | MEDIUM | Add essay text to results data model; add expandable essay panel to results component |
| Score visualization misleading users | LOW | Add "Suggested" labels, adjust color thresholds to percentage-based, surface justification text |
| No loading/error states | MEDIUM | Create shared `AsyncState` wrapper component; retrofit around all API call sites |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mock data shape mismatch | Phase 1 (Setup/API Layer) | TypeScript interfaces compile; mock data passes Zod validation; at least 3 response variants exist |
| Rubric state tangle | Phase 2 (Core Features) | Rubric store has normalized state; add/remove/reset operations pass unit tests; same type used in editor, submission, and results |
| PDF upload broken | Phase 2 (Core Features) | Upload a real multi-page PDF; extracted text appears in textarea with correct word count |
| Results page missing essay | Phase 2 (Data Model) + Phase 3 (Results UI) | Results store includes essay text; results page has "View Essay" capability |
| Score visualization misleading | Phase 3 (Results Display) | Scores labeled "Suggested"; color thresholds are percentage-based; justification visible without extra clicks |
| No loading/error states | Phase 2 (Submission Flow) | Mock API has simulated delay (1-3s); loading spinner appears; error state renders when mock returns error |
| Rubric editor lacks validation | Phase 2 (Rubric Editor) | Cannot submit with empty category name; cannot set max score to 0; validation messages visible |
| History page incomplete | Phase 4 (History) | Empty state renders; rows show preview data; clicking navigates to correct results |

## Sources

- Domain experience with education technology UX patterns (MEDIUM confidence)
- React/TypeScript mock-first architecture patterns (MEDIUM confidence)
- Common pdf.js integration issues from Mozilla documentation patterns (MEDIUM confidence)
- AI output display patterns from LLM-powered tool design (MEDIUM confidence)

Note: WebSearch was unavailable during this research. Findings are based on training data and domain knowledge. Confidence is MEDIUM across the board -- recommend validating PDF parsing approach and Zustand patterns against current documentation during implementation.

---
*Pitfalls research for: AI Essay Grading Frontend*
*Researched: 2026-03-08*
