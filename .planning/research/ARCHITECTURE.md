# Architecture Patterns

**Domain:** AI essay grading frontend (React SPA with mock-first API layer)
**Researched:** 2026-03-08
**Confidence:** HIGH -- well-established React/TypeScript patterns applied to a clearly scoped project

## Recommended Architecture

Feature-sliced folder structure with a centralized API abstraction layer, Zustand stores per domain, and React Router v6 for page routing. The critical architectural decision is the API layer boundary: all backend interactions flow through typed async functions that return mock data now and will swap to real Axios calls later by changing only function bodies.

```
src/
  api/                  # API abstraction layer (mock-first)
    client.ts           # Axios instance config (baseURL, interceptors)
    essays.ts           # submitEssay(), getEssayResult(), getHistory()
    mock/               # Mock data and delay simulation
      essays.ts         # Mock response factories
      delay.ts          # Simulated network delay helper
  components/           # Shared/reusable UI components
    ui/                 # Primitives: Button, Card, Input, TextArea, Badge
    layout/             # Shell, Header, Footer, PageContainer
    feedback/           # ScoreBar, FeedbackSection, CollapsiblePanel
    rubric/             # RubricEditor, RubricCategory, ScoreSlider
    essay/              # EssayInput, FileUpload, WordCount
  pages/                # Route-level page components (one per route)
    LandingPage.tsx
    GradingPage.tsx
    ResultsPage.tsx
    HistoryPage.tsx
  stores/               # Zustand stores
    useEssayStore.ts    # Current essay text, file, submission state
    useRubricStore.ts   # Rubric categories, scores, customization
    useResultStore.ts   # Grading results, feedback data
    useHistoryStore.ts  # Past submissions list
  types/                # Shared TypeScript interfaces
    essay.ts            # Essay, EssaySubmission
    rubric.ts           # RubricCategory, RubricConfig
    result.ts           # GradingResult, CategoryScore, Feedback
    api.ts              # API response wrappers
  hooks/                # Custom React hooks
    useSubmitEssay.ts   # Orchestrates submission flow
    useFileUpload.ts    # File reading, validation, extraction
  utils/                # Pure utility functions
    scoring.ts          # Color thresholds, percentage calculations
    validation.ts       # Input validation rules
  router.tsx            # React Router v6 route definitions
  App.tsx               # Root component (providers, layout shell)
  main.tsx              # Vite entry point
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Pages** | Route-level orchestration. Compose feature components, trigger store actions, handle navigation. | Stores (read/write), API layer (via hooks), Router |
| **API Layer** | All backend communication. Typed async functions returning domain objects. Mock implementations now, real Axios later. | External backend (future), Mock data module (now) |
| **Zustand Stores** | Domain state. Each store owns one slice of application state. No cross-store dependencies. | Pages and components read; pages and hooks write |
| **Shared Components** | Reusable UI primitives and domain-specific display components. No direct store access -- receive data via props. | Parent components only (props in, callbacks out) |
| **Hooks** | Complex multi-step logic (submit essay, upload file). Coordinate between API layer and stores. | API layer, Zustand stores |
| **Types** | Shared TypeScript interfaces. No runtime behavior. | Imported everywhere |
| **Utils** | Pure functions with no side effects or state. | Imported by components, hooks, stores |

### Data Flow

```
User Action
    |
    v
Page Component (event handler)
    |
    v
Custom Hook (useSubmitEssay)
    |
    +--> Zustand Store: set loading state
    |
    +--> API Layer: submitEssay(essayText, rubricConfig)
    |       |
    |       v
    |    Mock Module (now) / Axios call (future)
    |       |
    |       v
    |    Returns: GradingResult (typed)
    |
    +--> Zustand Store: set result data, clear loading
    |
    v
React re-renders (store subscription triggers UI update)
    |
    v
Results displayed in ScoreBar, FeedbackSection components
```

**Key principle:** Data flows down (props), actions flow up (callbacks), state lives in stores, API calls happen in hooks. Components never call the API layer directly -- they use hooks or store actions.

## Patterns to Follow

### Pattern 1: Mock-First API Layer with Typed Contracts

**What:** Every API function has a concrete TypeScript return type. Mock implementations live in a separate module. Swapping to real backend means changing the function body, not the signature.

**When:** Always. This is the core architectural pattern for this project.

**Example:**

```typescript
// types/result.ts
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    justification: string;
  };
}

export interface GradingResult {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxPossibleScore: number;
  summary: string;
  categoryScores: CategoryScore[];
  gradedAt: string;
}

// api/essays.ts
import { mockSubmitEssay } from './mock/essays';
import type { GradingResult } from '../types/result';
import type { RubricConfig } from '../types/rubric';

export async function submitEssay(
  essayText: string,
  rubric: RubricConfig
): Promise<GradingResult> {
  // MOCK: Replace this body with real Axios call later
  return mockSubmitEssay(essayText, rubric);
}

// api/mock/essays.ts
import { delay } from './delay';
import type { GradingResult } from '../../types/result';

export async function mockSubmitEssay(
  essayText: string,
  rubric: RubricConfig
): Promise<GradingResult> {
  await delay(1500); // Simulate network latency
  return {
    id: crypto.randomUUID(),
    essayExcerpt: essayText.slice(0, 100),
    overallScore: 18,
    maxPossibleScore: 24,
    summary: "The essay demonstrates solid understanding...",
    categoryScores: rubric.categories.map(cat => ({
      category: cat.name,
      score: Math.floor(Math.random() * (cat.maxScore + 1)),
      maxScore: cat.maxScore,
      feedback: {
        strengths: ["Clear thesis statement", "Good use of evidence"],
        improvements: ["Transitions between paragraphs could be smoother"],
        justification: "The essay meets most criteria for this category..."
      }
    })),
    gradedAt: new Date().toISOString()
  };
}
```

### Pattern 2: Zustand Store Per Domain (No Cross-Store Dependencies)

**What:** Each Zustand store manages one domain concept. Stores do not import or reference each other. Coordination happens in hooks or page components.

**When:** Always. Keeps stores testable and prevents circular dependency issues.

**Example:**

```typescript
// stores/useRubricStore.ts
import { create } from 'zustand';
import type { RubricCategory } from '../types/rubric';

const DEFAULT_CATEGORIES: RubricCategory[] = [
  { id: '1', name: 'Content & Ideas', maxScore: 6 },
  { id: '2', name: 'Organization', maxScore: 6 },
  { id: '3', name: 'Style/Voice', maxScore: 6 },
  { id: '4', name: 'Language Conventions', maxScore: 6 },
];

interface RubricState {
  categories: RubricCategory[];
  addCategory: (name: string, maxScore: number) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, updates: Partial<RubricCategory>) => void;
  resetToDefaults: () => void;
}

export const useRubricStore = create<RubricState>((set) => ({
  categories: [...DEFAULT_CATEGORIES],
  addCategory: (name, maxScore) =>
    set((state) => ({
      categories: [...state.categories, { id: crypto.randomUUID(), name, maxScore }],
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  resetToDefaults: () => set({ categories: [...DEFAULT_CATEGORIES] }),
}));
```

### Pattern 3: Page Components as Orchestrators

**What:** Page components (route-level) are the only components that directly access stores and coordinate between hooks. Shared components receive everything via props.

**When:** Always. This keeps shared components reusable and testable without store mocking.

**Example:**

```typescript
// pages/GradingPage.tsx
export function GradingPage() {
  const { categories } = useRubricStore();
  const { essayText, setEssayText } = useEssayStore();
  const { submit, isLoading } = useSubmitEssay();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const result = await submit(essayText, { categories });
    if (result) navigate(`/results/${result.id}`);
  };

  return (
    <PageContainer>
      <EssayInput value={essayText} onChange={setEssayText} />
      <RubricEditor categories={categories} /* ...callbacks */ />
      <Button onClick={handleSubmit} loading={isLoading}>
        Grade Essay
      </Button>
    </PageContainer>
  );
}
```

### Pattern 4: Collocated Route Definitions

**What:** All routes defined in a single `router.tsx` file using React Router v6 `createBrowserRouter`. Keeps routing centralized and easy to reason about.

**When:** Always for apps with fewer than ~15 routes.

**Example:**

```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { GradingPage } from './pages/GradingPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/grade', element: <GradingPage /> },
      { path: '/results/:id', element: <ResultsPage /> },
      { path: '/history', element: <HistoryPage /> },
    ],
  },
]);
```

### Pattern 5: Score Color Coding as Pure Utility

**What:** Score-to-color mapping is a pure function, not embedded in components. Thresholds are configurable.

**When:** Any time scores are displayed visually.

**Example:**

```typescript
// utils/scoring.ts
export type ScoreLevel = 'low' | 'medium' | 'high';

export function getScoreLevel(score: number, maxScore: number): ScoreLevel {
  const ratio = score / maxScore;
  if (ratio >= 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}

export const SCORE_COLORS: Record<ScoreLevel, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Store Access in Shared Components

**What:** Importing `useRubricStore` or `useEssayStore` directly inside `<ScoreBar>` or `<RubricCategory>`.

**Why bad:** Makes components untestable without store mocking. Breaks reusability. Creates hidden coupling that makes refactoring painful.

**Instead:** Pass data via props. Only page-level components access stores.

### Anti-Pattern 2: API Calls in Components

**What:** Calling `submitEssay()` directly from a component's onClick handler.

**Why bad:** Mixes concerns. Makes loading/error state management ad-hoc. When you need the same API call from two places, you duplicate logic.

**Instead:** Use custom hooks (e.g., `useSubmitEssay`) that encapsulate the API call, loading state, error handling, and store updates.

### Anti-Pattern 3: Shared Zustand Store for Everything

**What:** One massive store with essay text, rubric categories, results, history, loading states all together.

**Why bad:** Every component that reads any state re-renders on any state change. Becomes unmaintainable quickly. Testing requires setting up the entire application state.

**Instead:** One store per domain. Four small stores are better than one large store.

### Anti-Pattern 4: Inline Mock Data

**What:** Hardcoding mock responses inside API functions or components.

**Why bad:** When swapping to real backend, you have to hunt through the codebase for mock data. No single place to update mock responses during development.

**Instead:** All mock data lives in `api/mock/`. API functions delegate to mock module. To swap, change one import or function body.

### Anti-Pattern 5: Business Logic in Event Handlers

**What:** Computing aggregate scores, validating rubric constraints, or formatting feedback strings inline in JSX event handlers.

**Why bad:** Untestable, duplicated when the same logic is needed elsewhere, clutters component code.

**Instead:** Extract to `utils/` for pure computation or `hooks/` for stateful logic.

## Build Order (Dependency Chain)

The architecture has clear dependency layers. Build from the bottom up:

```
Layer 0: Types + Utils (no dependencies)
    |
Layer 1: API Layer + Mock Data (depends on Types)
    |
Layer 2: Zustand Stores (depends on Types)
    |
Layer 3: Shared Components (depends on Types, Utils -- NOT stores)
    |
Layer 4: Custom Hooks (depends on API Layer, Stores, Types)
    |
Layer 5: Pages (depends on everything above)
    |
Layer 6: Router + App Shell (depends on Pages, Layout components)
```

**Recommended build sequence:**

1. **Foundation:** Types, utility functions, Tailwind config, base layout shell
2. **Data layer:** API abstraction with mocks, Zustand stores
3. **UI primitives:** Button, Card, Input, TextArea -- shared across all pages
4. **Landing page:** Simple, proves routing and layout work
5. **Essay input + Rubric editor:** Core input experience (GradingPage minus submission)
6. **Submission flow + Results display:** Connect API layer, show grading output
7. **History page:** Read-only list page, simpler than grading flow
8. **Polish:** Loading states, error handling, responsive tweaks, color palette refinement

## Scalability Considerations

This is an academic project with no real scaling needs, but the architecture supports growth cleanly:

| Concern | Current (Demo) | If It Grew |
|---------|----------------|------------|
| State management | Zustand (4 small stores) | Same pattern scales to 10+ stores. Add persistence middleware if needed. |
| API layer | Mock functions | Swap to real Axios calls. Add error interceptors, retry logic, auth headers in `client.ts`. |
| Component library | Hand-built with Tailwind | Could adopt shadcn/ui or Radix primitives if component count exceeds ~20 unique elements. |
| Routing | 4 flat routes | React Router v6 supports nested routes, lazy loading via `React.lazy()` if bundle grows. |
| File uploads | Client-side text extraction | Would need server-side PDF parsing for production. Current architecture isolates this in `useFileUpload` hook. |

## Sources

- React and Vite project structure patterns are well-established community conventions (HIGH confidence -- standard React architecture)
- Zustand store-per-domain pattern is recommended in Zustand documentation and community guides (HIGH confidence)
- Mock-first API abstraction is a standard pattern for frontend-first development (HIGH confidence)
- React Router v6 `createBrowserRouter` is the current recommended API per React Router docs (HIGH confidence)
- Build ordering follows standard dependency-layer reasoning (HIGH confidence)
