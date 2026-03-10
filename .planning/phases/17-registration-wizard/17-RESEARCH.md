# Phase 17: Registration Wizard - Research

**Researched:** 2026-03-10
**Domain:** Multi-step wizard UI + backend preference persistence
**Confidence:** HIGH

## Summary

This phase adds a multi-step onboarding wizard after registration credential entry. The implementation spans three layers: (1) an Alembic migration adding `grade_level` and `writing_purpose` columns to the User model, (2) a new PATCH /api/auth/me endpoint for incremental preference updates, and (3) a React wizard component using motion/react for horizontal slide transitions between Welcome, Writing Purpose, and Grade Level steps.

The project already has all necessary libraries installed -- motion (v12.35+), lucide-react, Zustand with persist middleware, shadcn Card/Button components, and Alembic. No new dependencies are needed. The primary complexity is the wizard step orchestration with AnimatePresence directional slides and the ProtectedRoute modification to enforce wizard completion.

**Primary recommendation:** Build the backend migration + endpoint first, then the wizard UI as a self-contained component tree under `src/components/onboarding/`, and finally wire routing/store integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Credential entry is a separate screen before wizard begins -- existing register API creates account first
- 3 wizard steps after registration: Welcome intro, Writing Purpose (skippable), Grade Level (required)
- Welcome step: "Welcome to EssayGrader! Let's personalize your experience." with "Let's Go" CTA
- Writing Purpose: Work / School / Other -- skippable via Skip button
- Grade Level: Elementary / Middle School / High School / College -- required, must select before proceeding
- Horizontal slide transitions between steps (left on Next, right on Back)
- Brief "You're all set!" confirmation with checkmark animation, ~1.5s auto-redirect to /grade
- Backend database storage: add grade_level and writing_purpose columns (Alembic migration)
- New PATCH /api/auth/me endpoint for preference updates
- Preferences saved after each step -- incremental PATCH calls
- Zustand store remains runtime cache -- synced from backend via GET /api/auth/me
- GET /api/auth/me response expanded to include gradeLevel and writingPurpose fields
- Wizard re-shown on login if grade_level is null
- Wide centered card at ~75% screen width
- Rounded rectangle pill indicators for progress (not dots)
- Selectable cards/tiles for preference options with highlighted border on selection
- Lucide icons on option cards (Briefcase for Work, GraduationCap for School, Sparkles for Other)
- Grade level cards in a 2x2 grid layout

### Claude's Discretion
- Exact card sizing, padding, and responsive behavior below 75% width breakpoint
- Welcome step illustration or decorative element (if any)
- Exact Lucide icon choices for grade level options
- Skip button placement and styling
- Back button styling (text link vs. outlined button)
- Checkmark animation implementation for completion screen
- Error handling for PATCH failures during wizard

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | User goes through a multi-step slider wizard when registering | Wizard component with AnimatePresence directional slides, step state machine |
| ONBD-02 | Wizard asks writing purpose (work / school / other) -- skippable | WritingPurposeStep with optional selection + Skip button, PATCH on selection |
| ONBD-03 | Wizard asks grade level -- required, cannot be skipped | GradeLevelStep with required selection validation, Next disabled until selected |
| ONBD-04 | User is redirected to grading page after completing wizard | CompletionStep with checkmark animation + setTimeout redirect to /grade |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.35.1 | Slide transitions, checkmark animation | Already used throughout app (AnimatePresence, motion.div) |
| lucide-react | ^0.577.0 | Icons on option cards | Project standard for all icons |
| zustand | ^5.0.11 | Profile state with writingPurpose addition | Existing persist store pattern |
| react-router | ^7.13.1 | Navigation after wizard completion | Existing routing |
| axios | ^1.13.6 | PATCH /api/auth/me calls | Existing API client pattern |

### Backend (Already Installed)
| Library | Version | Purpose |
|---------|---------|---------|
| SQLAlchemy | (existing) | User model column additions |
| Alembic | (existing) | Migration for new columns |
| Pydantic | (existing) | CamelModel schema for update endpoint |
| FastAPI | (existing) | PATCH endpoint |

### Alternatives Considered
None needed -- all required libraries are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── onboarding/
│       ├── RegistrationWizard.tsx    # Main wizard orchestrator
│       ├── WizardProgress.tsx        # Pill-style progress indicators
│       ├── WelcomeStep.tsx           # Step 1: Welcome intro
│       ├── WritingPurposeStep.tsx    # Step 2: Work/School/Other
│       ├── GradeLevelStep.tsx        # Step 3: Grade level selection
│       ├── CompletionStep.tsx        # "You're all set!" with animation
│       └── SelectableCard.tsx        # Reusable selectable option card
├── pages/
│   └── RegisterPage.tsx              # Registration form + wizard flow
├── stores/
│   └── profile-store.ts             # Add writingPurpose, sync logic
└── api/
    └── auth.ts                       # Add updateProfile(), getMe()

backend/
├── app/
│   ├── models/
│   │   └── user.py                   # Add grade_level, writing_purpose columns
│   ├── schemas/
│   │   └── auth.py                   # Add UserUpdateRequest, expand UserResponse
│   └── routes/
│       └── auth.py                   # Add PATCH /api/auth/me endpoint
└── alembic/
    └── versions/
        └── xxxx_add_user_preferences.py  # Migration
```

### Pattern 1: Wizard Step State Machine
**What:** Single parent component manages current step index, direction (for animation), and step data. Each step is a pure presentational component receiving callbacks.
**When to use:** Multi-step forms with back/forward navigation.
**Example:**
```typescript
// RegistrationWizard.tsx
const [step, setStep] = useState(0);
const [direction, setDirection] = useState(1); // 1=forward, -1=backward

function goNext() {
  setDirection(1);
  setStep((s) => s + 1);
}

function goBack() {
  setDirection(-1);
  setStep((s) => s - 1);
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

return (
  <AnimatePresence mode="wait" custom={direction}>
    <motion.div
      key={step}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {steps[step]}
    </motion.div>
  </AnimatePresence>
);
```

### Pattern 2: Incremental PATCH on Step Completion
**What:** Each wizard step PATCHes the backend with its data before advancing. This ensures partial completion is persisted.
**When to use:** When wizard can be abandoned mid-flow and must resume.
**Example:**
```typescript
// In WritingPurposeStep
async function handleNext(purpose: WritingPurpose | null) {
  if (purpose) {
    await updateProfile({ writingPurpose: purpose });
    useProfileStore.getState().setWritingPurpose(purpose);
  }
  onNext();
}
```

### Pattern 3: Directional AnimatePresence with custom prop
**What:** The `custom` prop on AnimatePresence passes direction to variants, enabling forward=slide-left and backward=slide-right.
**When to use:** Any wizard or carousel with bidirectional navigation.
**Key detail:** The `custom` prop must be on BOTH `AnimatePresence` and `motion.div` for exit animations to use the updated direction value.

### Pattern 4: Wizard Gate in ProtectedRoute
**What:** After login, check if `gradeLevel` is null in user profile. If so, redirect to `/register?wizard=true` (or equivalent) to force wizard completion.
**When to use:** Enforcing required onboarding fields.
**Implementation approach:**
```typescript
// ProtectedRoute.tsx - after checking isSignedIn
const gradeLevel = useProfileStore((s) => s.gradeLevel);
const needsOnboarding = isSignedIn && gradeLevel === null;
if (needsOnboarding) {
  return <Navigate to="/register" replace />;
}
```

### Anti-Patterns to Avoid
- **Storing wizard state in URL params:** Step index should be component state, not URL -- prevents back-button confusion and deep-link issues with partial registration.
- **Single monolithic form:** Each step should be its own component for maintainability and independent PATCH calls.
- **Blocking UI on PATCH failures:** If a preference PATCH fails, show a toast but still allow the user to proceed -- the preference can be set later from profile page (Phase 18).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide transitions | Custom CSS transitions | motion/react AnimatePresence with variants | Already in project, handles enter/exit/direction |
| Form validation | Manual state checks | HTML required attribute + disabled button state | Grade level "required" is just "disable Next until selected" |
| Toast notifications | Custom error banners | sonner (already installed via Toaster) | Consistent with existing error handling |
| Progress indicators | Complex SVG | Simple div pills with Tailwind bg-primary / bg-muted | Requirements specify simple pill shapes |

**Key insight:** This wizard is intentionally simple -- 3 content steps, no complex validation, no file uploads. The complexity is in the animation choreography and backend integration, not form logic.

## Common Pitfalls

### Pitfall 1: AnimatePresence direction not updating on exit
**What goes wrong:** When clicking Back, the exiting component still slides in the forward direction because `custom` was only set on `motion.div`, not `AnimatePresence`.
**Why it happens:** AnimatePresence needs the `custom` prop too to pass updated values to exiting children.
**How to avoid:** Set `custom={direction}` on both `<AnimatePresence>` and `<motion.div>`.
**Warning signs:** Back button causes both old and new steps to slide the same direction.

### Pitfall 2: Race condition between PATCH and navigation
**What goes wrong:** User clicks Next, PATCH fires, but navigation happens before PATCH completes. If wizard is abandoned, the preference is lost.
**Why it happens:** Not awaiting the PATCH before advancing step.
**How to avoid:** Await the PATCH call before calling `goNext()`. Show a brief loading state on the Next button if needed.
**Warning signs:** Preferences not persisting after quick wizard completion.

### Pitfall 3: Zustand persist version mismatch
**What goes wrong:** Adding `writingPurpose` to the store breaks existing persisted state for logged-in users.
**Why it happens:** The persist middleware deserializes old state that lacks the new field.
**How to avoid:** Bump the persist `version` to 3 and add a migration that sets `writingPurpose: null` for old state.
**Warning signs:** Existing users get undefined/error on `writingPurpose` after upgrade.

### Pitfall 4: Wizard shown to existing users on every login
**What goes wrong:** The "re-show wizard if grade_level is null" logic redirects existing users who registered before this feature.
**Why it happens:** Existing users have `grade_level = NULL` in the database.
**How to avoid:** This is actually intended behavior per the context decisions -- existing users SHOULD complete the wizard. But the GET /api/auth/me response must correctly return `null` for these fields, and the frontend must handle the null check properly.
**Warning signs:** None -- this is correct behavior, just needs to be understood.

### Pitfall 5: RegisterPage dual-purpose confusion
**What goes wrong:** RegisterPage needs to serve two flows: (a) new registration (form + wizard) and (b) returning user who abandoned wizard (just wizard).
**Why it happens:** The wizard-gate redirect sends users to /register even if they already have an account.
**How to avoid:** RegisterPage should check `isSignedIn` -- if true, skip straight to wizard. If false, show registration form first.
**Warning signs:** Already-authenticated users seeing the registration form again.

## Code Examples

### Backend: User Model with Preference Columns
```python
# backend/app/models/user.py
from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    __tablename__ = "users"
    # ... existing columns ...
    grade_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    writing_purpose: Mapped[str | None] = mapped_column(String(20), nullable=True)
```

### Backend: PATCH Endpoint
```python
# backend/app/routes/auth.py
from app.schemas.auth import UserUpdateRequest

@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.grade_level is not None:
        current_user.grade_level = body.grade_level
    if body.writing_purpose is not None:
        current_user.writing_purpose = body.writing_purpose
    await db.commit()
    await db.refresh(current_user)
    return current_user
```

### Backend: Update Schema
```python
# backend/app/schemas/auth.py
class UserUpdateRequest(CamelModel):
    grade_level: str | None = None
    writing_purpose: str | None = None

class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    created_at: datetime
    grade_level: str | None = None
    writing_purpose: str | None = None
```

### Frontend: SelectableCard Component
```typescript
// src/components/onboarding/SelectableCard.tsx
import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface SelectableCardProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function SelectableCard({ icon: Icon, label, selected, onClick }: SelectableCardProps) {
  return (
    <Card
      className={`cursor-pointer p-6 text-center transition-all hover:border-primary/50 ${
        selected ? "border-2 border-primary bg-primary/5" : "border border-border"
      }`}
      onClick={onClick}
    >
      <Icon className="mx-auto mb-2 h-8 w-8 text-primary" />
      <p className="font-medium">{label}</p>
    </Card>
  );
}
```

### Frontend: Checkmark Animation
```typescript
// CompletionStep.tsx - checkmark with motion
import { motion } from "motion/react";
import { Check } from "lucide-react";

<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary"
>
  <motion.div
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ delay: 0.2, duration: 0.4 }}
  >
    <Check className="h-10 w-10 text-primary-foreground" />
  </motion.div>
</motion.div>
```

### Frontend: API Function
```typescript
// src/api/auth.ts
export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  gradeLevel: string | null;
  writingPurpose: string | null;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/auth/me");
  return data;
}

export async function updateProfile(
  updates: { gradeLevel?: string; writingPurpose?: string }
): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/auth/me", updates);
  return data;
}
```

### Frontend: Pill Progress Indicators
```typescript
// WizardProgress.tsx
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i <= currentStep ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion package (motion/react) | 2024 rebrand | Import from "motion/react" not "framer-motion" |
| Zustand v4 persist API | Zustand v5 persist API | 2024 | Same API surface, project already on v5 |

**Project-specific notes:**
- Project uses `motion` v12.35+ (the rebranded framer-motion) -- imports are `from "motion/react"`
- Existing AnimatePresence usage in GradingPage.tsx and WalkthroughDemo.tsx serves as proven patterns
- CamelModel base class auto-generates camelCase aliases -- backend uses snake_case, frontend receives camelCase

## Open Questions

1. **Registration form on RegisterPage: new form or reuse SignInDialog pattern?**
   - What we know: SignInDialog has email/password form with login/register tabs. RegisterPage is currently a placeholder. Context says credential entry is a "separate screen" before wizard.
   - What's unclear: Whether to extract the registration form from SignInDialog into a standalone form on RegisterPage, or build a new form following the same pattern.
   - Recommendation: Build a new standalone registration form on RegisterPage following the SignInDialog pattern (Input, validation, error display, loading state). It is cleaner than extracting/sharing with the dialog.

2. **GET /api/auth/me call timing for returning users**
   - What we know: On login, the store has token and email but no server-side preferences. Need to fetch /me to check grade_level.
   - What's unclear: Best place to trigger this fetch -- in the login flow itself or in ProtectedRoute.
   - Recommendation: After successful login in profile-store, immediately call getMe() to populate gradeLevel and writingPurpose. ProtectedRoute then checks the already-loaded store value.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | Needs investigation (playwright config may exist) |
| Quick run command | `npx playwright test --grep "wizard"` |
| Full suite command | `npx playwright test` |

### Phase Requirements Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBD-01 | Multi-step slider wizard appears after registration | e2e | `npx playwright test tests/onboarding.spec.ts` | No - Wave 0 |
| ONBD-02 | Writing purpose step is skippable | e2e | `npx playwright test tests/onboarding.spec.ts --grep "skip"` | No - Wave 0 |
| ONBD-03 | Grade level step is required | e2e | `npx playwright test tests/onboarding.spec.ts --grep "grade"` | No - Wave 0 |
| ONBD-04 | Redirect to grading page after completion | e2e | `npx playwright test tests/onboarding.spec.ts --grep "redirect"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser testing (wizard is highly visual)
- **Per wave merge:** Full Playwright suite if configured
- **Phase gate:** Manual walkthrough of complete registration-to-grading flow

### Wave 0 Gaps
- [ ] `tests/onboarding.spec.ts` -- e2e test for wizard flow
- [ ] Backend unit test for PATCH /api/auth/me endpoint
- [ ] Verify Playwright config exists and is functional

## Sources

### Primary (HIGH confidence)
- Project codebase inspection -- all existing patterns verified directly from source files
- `src/stores/profile-store.ts` -- current Zustand store structure and persist config
- `backend/app/models/user.py` -- current User model columns
- `backend/app/routes/auth.py` -- current auth endpoints
- `backend/app/schemas/auth.py` -- current Pydantic schemas with CamelModel
- `src/pages/GradingPage.tsx`, `src/components/landing/WalkthroughDemo.tsx` -- AnimatePresence usage patterns
- `package.json` -- confirmed all needed packages already installed

### Secondary (MEDIUM confidence)
- motion/react API for directional slide transitions -- based on existing project usage patterns and motion v12 API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in project
- Architecture: HIGH -- patterns derived from existing codebase conventions
- Pitfalls: HIGH -- based on common React animation and multi-step form issues
- Backend: HIGH -- straightforward SQLAlchemy column addition and FastAPI endpoint

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack, no external dependencies to change)
