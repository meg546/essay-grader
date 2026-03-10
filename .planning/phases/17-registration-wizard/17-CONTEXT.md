# Phase 17: Registration Wizard - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-step onboarding wizard that appears after registration credential entry. Captures writing purpose and grade level preferences before redirecting to the grading page. Profile settings page to edit these preferences later is Phase 18.

</domain>

<decisions>
## Implementation Decisions

### Wizard Steps & Flow
- Credential entry (email/password) is a **separate screen** before the wizard begins — existing register API creates account first
- **3 wizard steps** after registration: Welcome intro, Writing Purpose (skippable), Grade Level (required)
- Welcome step: "Welcome to EssayGrader! Let's personalize your experience." with a single "Let's Go" CTA
- Writing Purpose step: Work / School / Other options — skippable via Skip button
- Grade Level step: Elementary / Middle School / High School / College — required, must select before proceeding
- **Horizontal slide** transitions between steps — slides left on Next, slides right on Back
- **Brief confirmation** after final step: "You're all set!" with checkmark animation, ~1.5s auto-redirect to /grade

### Preference Persistence
- **Backend database** storage: add `grade_level` and `writing_purpose` columns to User model (Alembic migration)
- New **PATCH /api/auth/me** endpoint to update user preferences
- Preferences saved **after each step** — incremental PATCH calls as user progresses through wizard
- **Zustand store remains runtime cache** — synced from backend via GET /api/auth/me on login, updated locally on PATCH success
- GET /api/auth/me response expanded to include `gradeLevel` and `writingPurpose` fields
- **Wizard re-shown on login if grade_level is null** — user who abandoned wizard must complete it before accessing grading page

### Visual Design & Layout
- **Wide centered card** at ~75% screen width on a minimal background — consistent with registration form
- **Rounded rectangle pill indicators** for progress — filled with primary color for completed/current, muted for upcoming (not dots)
- **Selectable cards/tiles** for preference options — each option is a clickable card with highlighted border on selection
- **Lucide icons** on option cards (e.g., Briefcase for Work, GraduationCap for School, Sparkles for Other)
- Grade level cards in a 2x2 grid layout

### Claude's Discretion
- Exact card sizing, padding, and responsive behavior below 75% width breakpoint
- Welcome step illustration or decorative element (if any)
- Exact Lucide icon choices for grade level options
- Skip button placement and styling
- Back button styling (text link vs. outlined button)
- Checkmark animation implementation for completion screen
- Error handling for PATCH failures during wizard

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RegisterPage.tsx`: Placeholder at `/register` route — will be replaced with registration form + wizard flow
- `SignInDialog.tsx`: Has email/password form with validation, error handling, loading states — pattern reference for the registration form
- `useProfileStore`: Already has `gradeLevel`, `setGradeLevel`, `register()` — needs `writingPurpose` added and sync logic for backend preferences
- `Button` component: Existing variants for Next/Skip/Back CTAs
- `Card` component: Available for option selection cards
- `motion/react`: Already in project for AnimatePresence — use for slide transitions and completion checkmark

### Established Patterns
- Tailwind CSS with design tokens (bg-background, text-foreground, primary)
- Lucide icons throughout the app
- Zustand stores with persist middleware for state management
- CamelModel base class for Pydantic response serialization (camelCase JSON)
- Alembic for database migrations

### Integration Points
- `src/App.tsx`: `/register` route already exists — replace RegisterPage content
- `src/stores/profile-store.ts`: Add `writingPurpose` field, update `register()` flow to navigate to wizard
- `backend/app/models/user.py`: Add `grade_level` and `writing_purpose` columns
- `backend/app/schemas/auth.py`: Expand `UserResponse` with preference fields, add update schema
- `backend/app/routes/auth.py`: Add PATCH /api/auth/me endpoint
- `src/api/auth.ts`: Add `updateProfile()` API function and expand types
- `ProtectedRoute.tsx`: May need logic to redirect to wizard if grade_level is null

</code_context>

<specifics>
## Specific Ideas

- Progress indicators should be rounded rectangle pills (not dots) that change color — like a segmented progress bar
- Wizard card should be wide (~75% screen width), not a narrow centered dialog
- Option cards with Lucide icons above labels — tap to select, highlighted border on selection
- "You're all set!" confirmation with checkmark animation before auto-redirect to grading page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-registration-wizard*
*Context gathered: 2026-03-10*
