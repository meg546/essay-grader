# Feature Research

**Domain:** AI Essay Grading Frontend (Academic/Course Project)
**Researched:** 2026-03-08
**Confidence:** MEDIUM (based on training data knowledge of Turnitin, Gradescope, Grammarly, CoGrader, EssayGrader.ai, ASAP dataset conventions; no live web verification available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features an instructor expects when they hear "AI essay grading tool." Missing any of these makes the product feel like a toy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text input (paste or upload) | Instructors need to get essay text into the system; copy-paste is minimum, file upload (.txt, .pdf) is expected | LOW | Already in PROJECT.md requirements. Support paste first, upload second. |
| Rubric definition with categories and scales | The entire value prop is rubric-aligned grading; without editable rubrics the tool is useless for real instructor workflows | MEDIUM | Default ASAP categories (Content, Organization, Style, Conventions) on 0-6 scales. Allow add/remove/edit. |
| Per-category numerical scores | Instructors need to see how the essay performed on each rubric dimension, not just a single number | LOW | Score bars with color coding (green/yellow/red) are the standard pattern in Gradescope, Turnitin |
| Aggregate/total score | A single summary number is expected alongside breakdowns; instructors need a quick "how did this essay do" answer | LOW | Sum or weighted average of category scores |
| Written feedback per category | Numbers without explanation are useless; instructors expect justification for why an essay got that score | MEDIUM | Structure as: strengths, areas for improvement, score justification. Collapsible sections keep it scannable. |
| Overall summary | A top-level paragraph synthesizing the essay's quality before the per-category breakdown | LOW | 2-4 sentences covering the main takeaway |
| Loading/processing state | AI grading takes time (or appears to); users need to know the system is working | LOW | Progress indicator or skeleton screen during simulated delay |
| Submission history | Instructors grade many essays; they need to review past results without re-submitting | MEDIUM | Table with essay title/excerpt, date, score. Clickable rows to view full results. |
| Clean, professional UI | Education tools have a high bar for visual trust; a sloppy UI makes instructors doubt the AI's quality | MEDIUM | Calm color palette, clear typography, whitespace. Think "academic tool" not "startup MVP." |
| Responsive layout (tablet+) | Instructors often use tablets in classroom settings or while reviewing at home | LOW | Tailwind responsive utilities handle this naturally |

### Differentiators (Competitive Advantage)

Features that elevate this beyond a basic grading form. Not expected in a course project, but they make the demo impressive and the product feel polished.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Inline text highlighting with feedback annotations | Most grading tools (Turnitin, Gradescope) highlight specific passages; showing WHERE in the essay a score comes from is far more useful than abstract feedback | HIGH | Requires mapping feedback to text spans. Could be simplified to highlighting key sentences rather than character-level annotation. Significant frontend complexity. |
| Side-by-side essay + feedback view | Seeing the essay and its feedback simultaneously (rather than scrolling between them) dramatically improves the review experience | MEDIUM | Split-pane layout. The essay on the left, feedback on the right. Standard in Turnitin's interface. |
| Rubric templates/presets | Instead of building rubrics from scratch each time, offer preset rubrics for common essay types (argumentative, narrative, expository, research paper) | LOW | Just JSON presets. Low effort, high perceived polish. Good differentiator for a course project demo. |
| Score comparison visualization | Show how this essay's scores compare to the batch average (mock data) via a simple radar/spider chart or bar overlay | MEDIUM | Gives instructors context for individual scores. Requires chart library (recharts). Impressive in demos. |
| Feedback tone controls | Let instructors choose feedback style: encouraging, balanced, or critical. Controls how the AI frames strengths vs weaknesses | LOW | In a mock-first frontend, this is just a dropdown that switches which mock response is returned. Demonstrates thoughtful UX. |
| PDF/print export of results | Instructors need to share feedback with students; a clean PDF export of scores + feedback is valuable | MEDIUM | Use browser print styles or a library like react-to-print. PROJECT.md marks this as placeholder-only, which is fine for v1. |
| Batch/multi-essay upload | Grade multiple essays against the same rubric at once | HIGH | Significant UI complexity (file list, progress per essay, results table). Defer to v2 but design the API layer to support it. |
| Dark mode | Instructors grading late at night appreciate it; also demonstrates UI polish | LOW | Tailwind dark mode utilities. Low effort if planned from the start, painful to retrofit. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build, especially for a course project frontend.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative editing | "Google Docs for grading" sounds appealing | Enormous complexity (CRDT/OT, WebSockets, conflict resolution). Completely out of scope for a frontend demo with mock data. | Single-user experience. Keep it simple. |
| Plagiarism detection | Adjacent to essay grading in instructor minds | Entirely different domain (text similarity, source databases). Turnitin's moat. Would dilute the grading focus. | Explicitly state this is out of scope. Link to Turnitin if needed. |
| Student-facing portal | "Students should see their feedback too" | Doubles the UI surface area. Requires auth, roles, permissions. This is an instructor tool. | Build instructor-only. Student sharing via PDF export placeholder. |
| Auto-save with version history | Seems like table stakes for document apps | This is a grading tool, not a document editor. Essay text is input, not authored here. Over-engineering. | Simple form state. Warn before navigating away with unsaved input. |
| AI chatbot for rubric help | "Help me build my rubric with AI" | Scope creep. The AI is for grading, not rubric design. Requires a second AI interaction pattern. | Good default rubric presets solve the same problem with zero complexity. |
| Detailed analytics dashboard | Charts showing score distributions, trends over time, class performance | Requires real data (many essays graded). With mock data, analytics are meaningless. Massive UI investment for no demo value. | Simple submission history table. Defer analytics to when real backend exists. |
| Mobile-optimized layout | "Everything should work on phones" | Essay grading involves reading full essays and detailed feedback. Phone screens are too small for this workflow. Tablet is the realistic minimum. | Responsive down to tablet (768px). Phone users get a "use a larger screen" message. |

## Feature Dependencies

```
[Rubric Definition]
    └──requires──> [Per-Category Scores] (scores map to rubric categories)
                       └──requires──> [Score Visualization] (bars need score data)
                       └──requires──> [Per-Category Feedback] (feedback maps to categories)

[Text Input (paste/upload)]
    └──requires──> [Submission Flow] (need essay text to submit)
                       └──requires──> [Loading State] (submission triggers processing)
                       └──requires──> [Results Page] (submission produces results)

[Submission History]
    └──requires──> [Results Page] (history links to past results)

[Side-by-Side View] ──enhances──> [Results Page]

[Inline Highlighting] ──enhances──> [Results Page]
    └──requires──> [Per-Category Feedback] (highlights map to feedback)

[Rubric Templates] ──enhances──> [Rubric Definition]

[Score Comparison] ──requires──> [Submission History] (needs multiple scores to compare)

[Dark Mode] ──independent── (can be added at any point if Tailwind dark: classes used from start)
```

### Dependency Notes

- **Rubric Definition is foundational:** Every scoring and feedback feature depends on having rubric categories defined. Build this first.
- **Text Input + Submission Flow is the critical path:** The core user journey is: enter essay + rubric -> submit -> see results. This must work end-to-end before any polish.
- **Submission History requires Results Page:** Can't link to past results if the results page doesn't exist yet.
- **Inline Highlighting is the hardest enhancement:** Requires text span mapping, scroll synchronization, and careful UX. Only attempt after core flow is solid.
- **Dark Mode is free if planned early:** Use Tailwind's `dark:` prefix from the start. Retrofitting dark mode into an existing design is painful.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed for a compelling course project demo.

- [ ] Landing page with clear project description and "Start Grading" CTA -- first impression matters for a demo
- [ ] Essay input via paste (textarea) with word/character count -- the minimum input method
- [ ] File upload for .txt and .pdf -- instructors expect this, and it shows technical range
- [ ] Default ASAP rubric with editable categories (add/remove/rename, adjust scales) -- the core differentiator of rubric-aligned grading
- [ ] Submission flow with loading animation and simulated delay -- makes the mock feel real
- [ ] Results page with per-category color-coded score bars -- the payoff of the entire app
- [ ] Aggregate score display -- quick summary number
- [ ] Per-category structured feedback (strengths, improvements, justification) in collapsible sections -- the meat of the feedback
- [ ] Overall summary paragraph at top -- quick takeaway before details
- [ ] Submission history table with 5-8 mock entries -- shows the app works at scale
- [ ] Clickable history rows navigating to individual results -- completes the history feature
- [ ] Mock API layer with typed async functions -- demonstrates production-ready architecture

### Add After Validation (v1.x)

Features to add once the core flow works and demo is solid.

- [ ] Rubric templates/presets (argumentative, narrative, expository, research) -- low effort, high demo polish
- [ ] Side-by-side essay + feedback view on results page -- significantly improves the review experience
- [ ] Feedback tone selector (encouraging/balanced/critical) -- demonstrates thoughtful UX design
- [ ] Dark mode toggle -- shows UI polish, easy with Tailwind if dark: classes used from start
- [ ] PDF export button (placeholder or basic react-to-print) -- completes the "share feedback" story

### Future Consideration (v2+)

Features to defer until real backend integration.

- [ ] Inline text highlighting with feedback annotations -- requires real AI output with text span data
- [ ] Score comparison/analytics visualization -- needs real grading data to be meaningful
- [ ] Batch/multi-essay upload -- significant complexity, only valuable with real backend
- [ ] Actual backend integration (swap mock functions for real API calls) -- the whole point of the API layer design

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Essay text input (paste + upload) | HIGH | LOW | P1 |
| Editable rubric with defaults | HIGH | MEDIUM | P1 |
| Submission flow + loading state | HIGH | LOW | P1 |
| Per-category score bars (color-coded) | HIGH | LOW | P1 |
| Aggregate score | HIGH | LOW | P1 |
| Per-category structured feedback | HIGH | MEDIUM | P1 |
| Overall summary paragraph | HIGH | LOW | P1 |
| Submission history table | MEDIUM | MEDIUM | P1 |
| Landing page | MEDIUM | LOW | P1 |
| Responsive layout (tablet+) | MEDIUM | LOW | P1 |
| Rubric templates/presets | MEDIUM | LOW | P2 |
| Side-by-side essay + feedback | HIGH | MEDIUM | P2 |
| Feedback tone selector | MEDIUM | LOW | P2 |
| Dark mode | LOW | LOW | P2 |
| PDF export (placeholder) | MEDIUM | MEDIUM | P2 |
| Inline text highlighting | HIGH | HIGH | P3 |
| Score comparison charts | MEDIUM | MEDIUM | P3 |
| Batch upload | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (course project demo)
- P2: Should have, add for polish if time permits
- P3: Nice to have, defer to backend integration phase

## Competitor Feature Analysis

| Feature | Turnitin Feedback Studio | Gradescope | CoGrader / EssayGrader.ai | Our Approach |
|---------|--------------------------|------------|---------------------------|--------------|
| Text input | Integrated with LMS | PDF upload, scanned docs | Paste or upload | Paste + file upload (.txt, .pdf) |
| Rubric | Pre-built + custom, complex UI | AI-assisted rubric, detailed | Simple preset rubrics | Editable ASAP defaults, add/remove categories |
| Scoring | Per-criterion numeric | Per-question, AI-suggested | Per-category 1-10 or letter | Per-category 0-6 bars, color-coded |
| Feedback | Inline comments + summary | Inline annotations on PDF | AI-generated paragraphs | Structured per-category (strengths/improvements/justification) |
| Inline highlighting | Yes (core feature) | Yes (on PDF overlay) | Limited | Defer to v2 (requires real AI span data) |
| History/batch | Full class management | Full course management | Basic history | Simple mock history table |
| Analytics | Class-wide reports | Distribution charts | Basic stats | Defer (meaningless with mock data) |
| Export | PDF, LMS integration | CSV, PDF | PDF | Placeholder button (v1), react-to-print (v1.x) |
| Auth/roles | Full LMS integration | Institution SSO | Email/password | None (out of scope for course project) |

**Key insight from competitor analysis:** The major players (Turnitin, Gradescope) are deeply integrated with LMS platforms and institution infrastructure. This project correctly avoids that complexity. The AI-native startups (CoGrader, EssayGrader.ai) focus on simple input -> AI feedback -> results, which is exactly the pattern this project should follow. Our differentiator within a course project context is the clean, well-structured frontend with rubric customization and a production-ready API layer.

## Sources

- Training data knowledge of Turnitin Feedback Studio, Gradescope (by Turnitin), CoGrader, EssayGrader.ai, Grammarly's essay tools (MEDIUM confidence -- based on pre-May 2025 training data, features may have changed)
- ASAP (Automated Student Assessment Prize) dataset conventions referenced in PROJECT.md (HIGH confidence -- well-established dataset)
- General UX patterns for education technology tools (MEDIUM confidence -- training data)

**Note:** Web search and fetch were unavailable during this research session. All competitor analysis is based on training data (pre-May 2025). Feature sets of specific competitors should be verified if decisions depend on them.

---
*Feature research for: AI Essay Grading Frontend*
*Researched: 2026-03-08*
