# Requirements: AI Essay Grader

**Defined:** 2026-03-08
**Core Value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages

## v1.0 Requirements (Complete)

### Essay Input

- [x] **INPT-01**: User can paste essay text into a large textarea
- [x] **INPT-02**: User can see word and character count update as they type/paste
- [x] **INPT-03**: User can upload essay via .txt or .pdf file (drag-and-drop or click)
- [x] **INPT-04**: User can see extracted text preview after uploading a PDF

### Rubric

- [x] **RUBR-01**: User sees default ASAP rubric (Content & Ideas, Organization, Style/Voice, Language Conventions) on 0-6 scales
- [x] **RUBR-02**: User can rename rubric categories
- [x] **RUBR-03**: User can add and remove rubric categories
- [x] **RUBR-04**: User can adjust max score per category
- [x] **RUBR-05**: User can reset rubric to default ASAP categories

### Submission

- [x] **SUBM-01**: User can submit essay + rubric for grading
- [x] **SUBM-02**: User sees loading animation during grading (simulated delay)
- [x] **SUBM-03**: User is redirected to results page after grading completes

### Results

- [x] **RSLT-01**: User sees overall summary paragraph at top of results
- [x] **RSLT-02**: User sees per-category color-coded score bars (green/yellow/red)
- [x] **RSLT-03**: User sees aggregate/total score
- [x] **RSLT-04**: User can expand/collapse per-category feedback sections (strengths, improvements, justification)

### API Layer

- [x] **API-01**: All backend interactions use typed async functions returning mock data
- [x] **API-02**: Mock data includes simulated delays for realistic feel
- [x] **API-03**: API layer is structured so swapping to real Axios calls requires only changing function bodies

### Navigation & Layout

- [x] **NAVL-02**: User can navigate between pages
- [x] **NAVL-04**: UI is responsive down to tablet (768px)
- [x] **NAVL-05**: UI has clean, professional, education-focused design with calm color palette

## v1.1 Requirements

### Layout & Navigation

- [ ] **LAYOUT-01**: Home page displays hero section with app title, description, and grading input area on a single page
- [ ] **LAYOUT-02**: Hero section collapses to a minimal bar when user focuses on the essay input textarea
- [ ] **LAYOUT-03**: After grading, results display in side-by-side layout with essay on left and feedback/scores on right
- [ ] **LAYOUT-04**: Side-by-side layout stacks vertically on tablet breakpoints (<1024px)
- [x] **NAV-01**: Navigation has two tabs: Home and Profile
- [x] **NAV-02**: Home tab navigates to the combined grading page, Profile tab to profile/auth page

### Text Highlighting

- [ ] **HLGT-01**: Mock API responses include highlight ranges (start, end, categoryId) mapping feedback to essay passages
- [ ] **HLGT-02**: Essay passages are always color-coded by feedback category in the results view
- [ ] **HLGT-03**: Clicking a feedback card scrolls the essay panel to the relevant highlighted passage
- [ ] **HLGT-04**: Category color legend is visible with toggles to show/hide highlighting per category
- [ ] **HLGT-05**: Hovering a feedback card pulses/intensifies the corresponding essay highlight, and vice versa

### Editing

- [ ] **EDIT-01**: User can edit essay text in the results view left panel
- [ ] **EDIT-02**: User can resubmit edited essay for re-grading without navigating away
- [ ] **EDIT-03**: During re-grading, results panel shows loading state while essay remains visible

### Authentication

- [ ] **AUTH-01**: Profile page shows email+password sign-in form when user is not authenticated
- [ ] **AUTH-02**: Mock sign-in validates email format and password length, simulates async delay
- [ ] **AUTH-03**: After sign-in, profile page displays settings and history (existing functionality)
- [ ] **AUTH-04**: User can sign out, returning to the sign-in form

## Future Requirements

- **POLISH-01**: Highlight intensity varies by feedback severity
- **POLISH-02**: Smooth hero collapse animation with transform/opacity transitions
- **POLISH-03**: Dark mode toggle support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real OAuth / social login | Massive complexity for demo app; mock auth sufficient |
| Resizable / draggable split panes | Unnecessary complexity; fixed split sufficient for grading |
| Rich text editing (bold, italic, toolbar) | Grading evaluates plain text; no formatting needed |
| Character-level inline comments | Too complex; passage-level highlighting achieves 80% of UX value |
| Plagiarism / AI detection scoring | Different product domain |
| PDF export of results | Disproportionate effort for demo value |
| Mobile layout (<768px) | Side-by-side fundamentally requires wider viewports |
| Actual AI model integration | Backend developed separately |
| Database / persistent storage | Mock data only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 8 | Pending |
| LAYOUT-02 | Phase 8 | Pending |
| LAYOUT-03 | Phase 9 | Pending |
| LAYOUT-04 | Phase 9 | Pending |
| NAV-01 | Phase 7 | Complete |
| NAV-02 | Phase 7 | Complete |
| HLGT-01 | Phase 7 | Pending |
| HLGT-02 | Phase 9 | Pending |
| HLGT-03 | Phase 9 | Pending |
| HLGT-04 | Phase 9 | Pending |
| HLGT-05 | Phase 9 | Pending |
| EDIT-01 | Phase 10 | Pending |
| EDIT-02 | Phase 10 | Pending |
| EDIT-03 | Phase 10 | Pending |
| AUTH-01 | Phase 10 | Pending |
| AUTH-02 | Phase 10 | Pending |
| AUTH-03 | Phase 10 | Pending |
| AUTH-04 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after v1.1 roadmap creation*
