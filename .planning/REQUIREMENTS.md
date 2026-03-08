# Requirements: AI Essay Grader

**Defined:** 2026-03-08
**Core Value:** Instructors can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback

## v1 Requirements

### Essay Input

- [ ] **INPT-01**: User can paste essay text into a large textarea
- [ ] **INPT-02**: User can see word and character count update as they type/paste
- [ ] **INPT-03**: User can upload essay via .txt or .pdf file (drag-and-drop or click)
- [ ] **INPT-04**: User can see extracted text preview after uploading a PDF

### Rubric

- [ ] **RUBR-01**: User sees default ASAP rubric (Content & Ideas, Organization, Style/Voice, Language Conventions) on 0-6 scales
- [ ] **RUBR-02**: User can rename rubric categories
- [ ] **RUBR-03**: User can add and remove rubric categories
- [ ] **RUBR-04**: User can adjust max score per category
- [ ] **RUBR-05**: User can reset rubric to default ASAP categories

### Submission

- [ ] **SUBM-01**: User can submit essay + rubric for grading
- [ ] **SUBM-02**: User sees loading animation during grading (simulated delay)
- [ ] **SUBM-03**: User is redirected to results page after grading completes

### Results

- [ ] **RSLT-01**: User sees overall summary paragraph at top of results
- [ ] **RSLT-02**: User sees per-category color-coded score bars (green/yellow/red)
- [ ] **RSLT-03**: User sees aggregate/total score
- [ ] **RSLT-04**: User can expand/collapse per-category feedback sections (strengths, improvements, justification)

### History

- [ ] **HIST-01**: User can view submission history table with past graded essays
- [ ] **HIST-02**: User can click a history row to view its full results

### Navigation & Layout

- [ ] **NAVL-01**: User sees landing page with project description and "Start Grading" CTA
- [ ] **NAVL-02**: User can navigate between landing, grading, results, and history pages
- [ ] **NAVL-03**: User can toggle dark mode
- [ ] **NAVL-04**: UI is responsive down to tablet (768px)
- [ ] **NAVL-05**: UI has clean, professional, education-focused design with calm color palette

### API Layer

- [ ] **API-01**: All backend interactions use typed async functions returning mock data
- [ ] **API-02**: Mock data includes simulated delays for realistic feel
- [ ] **API-03**: API layer is structured so swapping to real Axios calls requires only changing function bodies

## v2 Requirements

### Differentiators

- **DIFF-01**: Rubric templates/presets for common essay types (argumentative, narrative, expository, research)
- **DIFF-02**: Side-by-side essay + feedback view on results page
- **DIFF-03**: Feedback tone selector (encouraging/balanced/critical)
- **DIFF-04**: PDF export of results (functional, not placeholder)
- **DIFF-05**: Inline text highlighting with feedback annotations (requires real AI span data)
- **DIFF-06**: Score comparison/analytics visualization
- **DIFF-07**: Batch/multi-essay upload

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / user accounts | Not needed for course project demo |
| Actual AI model integration | Backend developed separately (FastAPI + Llama 3.2 3B) |
| Plagiarism detection | Different domain entirely, not part of grading scope |
| Student-facing portal | This is an instructor tool; students receive feedback via other means |
| Real-time collaborative editing | Enormous complexity, not relevant to grading workflow |
| Analytics dashboard | Meaningless with mock data; defer to real backend |
| Mobile-optimized layout | Essay grading workflow requires tablet minimum (768px) |
| Docker / deployment setup | Comes later, not part of frontend deliverable |
| Multi-language support | English only for course project |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPT-01 | — | Pending |
| INPT-02 | — | Pending |
| INPT-03 | — | Pending |
| INPT-04 | — | Pending |
| RUBR-01 | — | Pending |
| RUBR-02 | — | Pending |
| RUBR-03 | — | Pending |
| RUBR-04 | — | Pending |
| RUBR-05 | — | Pending |
| SUBM-01 | — | Pending |
| SUBM-02 | — | Pending |
| SUBM-03 | — | Pending |
| RSLT-01 | — | Pending |
| RSLT-02 | — | Pending |
| RSLT-03 | — | Pending |
| RSLT-04 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| NAVL-01 | — | Pending |
| NAVL-02 | — | Pending |
| NAVL-03 | — | Pending |
| NAVL-04 | — | Pending |
| NAVL-05 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| API-03 | — | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 (pending roadmap creation)

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after initial definition*
