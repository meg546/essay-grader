# UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify app to 3 routes (Home/Grade/Profile), inline results on grade page, replace manual rubric editor with PDF upload, add skeletal profile with grade level and history.

**Architecture:** Grade page gets a `view` state toggle (input vs results). Profile store with localStorage persistence. Rubric upload replaces category editor. Existing results components reused inside GradingPage.

**Tech Stack:** React, React Router v7, Zustand, shadcn/ui, Tailwind, lucide-react

---

### Task 1: Add Profile Store with localStorage Persistence

**Files:**
- Create: `src/stores/profile-store.ts`

**Step 1: Create the profile store**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GradeLevel = "elementary" | "middle-school" | "high-school" | "college";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: "Elementary",
  "middle-school": "Middle School",
  "high-school": "High School",
  college: "College",
};

interface ProfileState {
  email: string;
  gradeLevel: GradeLevel;
  isSignedIn: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  setGradeLevel: (level: GradeLevel) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      email: "",
      gradeLevel: "high-school",
      isSignedIn: false,
      signIn: (email) => set({ email, isSignedIn: true }),
      signOut: () => set({ email: "", isSignedIn: false }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
    }),
    { name: "essay-grader-profile" }
  )
);
```

**Step 2: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/stores/profile-store.ts
git commit -m "feat: add profile store with localStorage persistence"
```

---

### Task 2: Create Profile Page

**Files:**
- Create: `src/pages/ProfilePage.tsx`

**Step 1: Create the profile page**

```tsx
import { useState } from "react";
import { useProfileStore, GRADE_LEVEL_LABELS } from "@/stores/profile-store";
import type { GradeLevel } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfilePage() {
  const { email, gradeLevel, isSignedIn, signIn, signOut, setGradeLevel } =
    useProfileStore();
  const history = useAppStore((s) => s.history);
  const [emailInput, setEmailInput] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {isSignedIn ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{email}</p>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (emailInput.trim()) signIn(emailInput.trim());
              }}
              className="flex gap-2"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <Button type="submit">Sign In</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={gradeLevel}
            onValueChange={(v) => setGradeLevel(v as GradeLevel)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GRADE_LEVEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-sm text-muted-foreground">
            Used when no rubric is provided to calibrate feedback to your level.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grading History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No grading history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {result.essayExcerpt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.gradedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 text-sm font-semibold">
                    {result.overallScore}/{result.maxScore}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Check if Select component exists, install if needed**

Run: `ls src/components/ui/select.tsx 2>/dev/null || npx shadcn@latest add select`

**Step 3: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/ProfilePage.tsx src/components/ui/select.tsx
git commit -m "feat: add skeletal profile page with account, grade level, and history"
```

---

### Task 3: Replace Rubric Editor with Rubric Upload

**Files:**
- Create: `src/components/grading/RubricUpload.tsx`
- Modify: `src/stores/app-store.ts` — replace rubric category state with rubric file state

**Step 1: Update the app store**

In `src/stores/app-store.ts`, replace rubric category state:

Remove: `rubricCategories`, `setRubricCategories`, `updateCategory`, `addCategory`, `removeCategory`, `resetRubric`, `ASAP_DEFAULT_RUBRIC`

Add: `rubricFile: File | null`, `setRubricFile: (file: File | null) => void`

Updated store:

```typescript
import { create } from "zustand";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  essayText: string;
  rubricFile: File | null;
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentResult: null,
  history: [],
  essayText: "",
  rubricFile: null,
  setCurrentResult: (result) => set({ currentResult: result }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
  clearCurrentResult: () => set({ currentResult: null }),
  setEssayText: (text) => set({ essayText: text }),
  setRubricFile: (file) => set({ rubricFile: file }),
}));
```

**Step 2: Create RubricUpload component**

```tsx
import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RubricUploadProps {
  disabled?: boolean;
}

export function RubricUpload({ disabled }: RubricUploadProps) {
  const rubricFile = useAppStore((s) => s.rubricFile);
  const setRubricFile = useAppStore((s) => s.setRubricFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "pdf") {
        toast.error("Only PDF rubrics are supported");
        return;
      }
      setRubricFile(file);
    },
    [setRubricFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rubric (Optional)</CardTitle>
      </CardHeader>
      <CardContent className={cn(disabled && "opacity-60 pointer-events-none")}>
        {rubricFile ? (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">{rubricFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setRubricFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Upload your assignment rubric
              </p>
              <p className="text-xs text-muted-foreground">
                PDF only — or skip and we'll grade based on your grade level
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
```

**Step 3: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: Errors in GradingPage.tsx (references old rubric props) — will fix in Task 5

**Step 4: Commit**

```bash
git add src/stores/app-store.ts src/components/grading/RubricUpload.tsx
git commit -m "feat: replace rubric editor with PDF upload component"
```

---

### Task 4: Update API Types and Mock

**Files:**
- Modify: `src/api/types.ts` — update GradeEssayRequest
- Modify: `src/api/grading.ts` — accept new request shape

**Step 1: Update types**

In `src/api/types.ts`:

Remove `RubricCategory` interface. Update `GradeEssayRequest`:

```typescript
export interface GradeEssayRequest {
  essayText: string;
  rubricFile?: File;
  gradeLevel: string;
}
```

Keep `CategoryScore`, `GradingResult`, `HistoryItem` unchanged.

**Step 2: Update grading API mock**

In `src/api/grading.ts`, update the function signature:

```typescript
import { delay } from "./delay";
import { mockGradingResult } from "./mock-data";
import type { GradeEssayRequest, GradingResult } from "./types";

export async function gradeEssay(
  request: GradeEssayRequest,
): Promise<GradingResult> {
  await delay(1500);
  return {
    ...mockGradingResult,
    id: crypto.randomUUID(),
    essayExcerpt: request.essayText.slice(0, 120) + "...",
    gradedAt: new Date().toISOString(),
  };
}
```

Remove `getGradingResult` function (no longer needed — no standalone results page).

**Step 3: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: Errors in GradingPage.tsx — fixed in next task

**Step 4: Commit**

```bash
git add src/api/types.ts src/api/grading.ts
git commit -m "feat: update grading API to accept rubric file and grade level"
```

---

### Task 5: Rewrite Grade Page with Inline Results

**Files:**
- Modify: `src/pages/GradingPage.tsx` — two-state page (input / results)

**Step 1: Rewrite GradingPage**

```tsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useProfileStore } from "@/stores/profile-store";
import { gradeEssay } from "@/api/grading";
import { Button } from "@/components/ui/button";
import { EssayInput } from "@/components/grading/EssayInput";
import { RubricUpload } from "@/components/grading/RubricUpload";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";

export function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const rubricFile = useAppStore((s) => s.rubricFile);
  const currentResult = useAppStore((s) => s.currentResult);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const clearCurrentResult = useAppStore((s) => s.clearCurrentResult);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const setEssayText = useAppStore((s) => s.setEssayText);
  const setRubricFile = useAppStore((s) => s.setRubricFile);
  const gradeLevel = useProfileStore((s) => s.gradeLevel);
  const [isGrading, setIsGrading] = useState(false);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    setIsGrading(true);
    try {
      const result = await gradeEssay({
        essayText,
        rubricFile: rubricFile ?? undefined,
        gradeLevel,
      });
      setCurrentResult(result);
      addToHistory(result);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGrading(false);
    }
  }

  function handleReset() {
    clearCurrentResult();
    setEssayText("");
    setRubricFile(null);
  }

  if (currentResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grading Results</h1>
          <Button variant="outline" onClick={handleReset}>
            Grade Another
          </Button>
        </div>
        <ResultsSummary result={currentResult} />
        <ScoreOverview categories={currentResult.categories} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Detailed Feedback</h2>
          {currentResult.categories.map((cat) => (
            <CategoryFeedback key={cat.name} category={cat} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grade Essay</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput disabled={isGrading} />
        <RubricUpload disabled={isGrading} />
      </div>

      <Button disabled={isSubmitDisabled} size="lg" onClick={handleSubmit}>
        {isGrading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reviewing your work...
          </>
        ) : (
          "Submit for Grading"
        )}
      </Button>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: No errors (or errors only in files being removed next task)

**Step 3: Commit**

```bash
git add src/pages/GradingPage.tsx
git commit -m "feat: rewrite grade page with inline results and rubric upload"
```

---

### Task 6: Update Routes, Nav, and Home Page

**Files:**
- Modify: `src/App.tsx` — update routes
- Modify: `src/components/layout/Header.tsx` — update nav items
- Modify: `src/pages/LandingPage.tsx` — real home page content

**Step 1: Update App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from "react-router"
import { Layout } from "@/components/layout/Layout"
import { LandingPage } from "@/pages/LandingPage"
import { GradingPage } from "@/pages/GradingPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/grade" element={<GradingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
```

**Step 2: Update Header.tsx nav items**

Change the `navItems` array:

```typescript
const navItems = [
  { to: "/", label: "Home" },
  { to: "/grade", label: "Grade" },
  { to: "/profile", label: "Profile" },
] as const
```

**Step 3: Rewrite LandingPage.tsx**

```tsx
import { Link } from "react-router";
import { GraduationCapIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <GraduationCapIcon className="mb-6 h-16 w-16 text-primary" />
      <h1 className="text-4xl font-bold tracking-tight">EssayGrader</h1>
      <p className="mt-2 text-xl text-muted-foreground">
        AI-powered essay feedback in seconds
      </p>

      <p className="mx-auto mt-6 max-w-md text-muted-foreground">
        Upload your essay and optionally add a rubric from your assignment.
        Get scored feedback with strengths, areas for improvement, and
        detailed justification for each category.
      </p>

      <Link
        to="/grade"
        className={buttonVariants({ size: "lg", className: "mt-8" })}
      >
        Grade an Essay
      </Link>
    </div>
  );
}
```

**Step 4: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/Header.tsx src/pages/LandingPage.tsx
git commit -m "feat: update routes to Home/Grade/Profile, add real home page"
```

---

### Task 7: Remove Dead Code

**Files:**
- Delete: `src/pages/ResultsPage.tsx`
- Delete: `src/pages/HistoryPage.tsx`
- Delete: `src/components/grading/RubricEditor.tsx`
- Delete: `src/components/grading/RubricCategoryRow.tsx`

**Step 1: Delete files**

```bash
rm src/pages/ResultsPage.tsx src/pages/HistoryPage.tsx src/components/grading/RubricEditor.tsx src/components/grading/RubricCategoryRow.tsx
```

**Step 2: Verify build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx tsc --noEmit`
Expected: No errors

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove dead code (ResultsPage, HistoryPage, RubricEditor)"
```

---

## Verification Checklist

After all tasks:

1. Home page shows headline, description, and CTA button
2. `/grade` — essay input + rubric upload zone + submit
3. Submit shows loading → results appear inline on same page
4. "Grade Another" resets to input view
5. `/profile` — email sign-in, grade level dropdown, grading history
6. Nav shows Home | Grade | Profile (3 items only)
7. No dead routes (`/results`, `/history`)
8. Profile data persists across page refresh (localStorage)
9. Build succeeds with no TypeScript errors
