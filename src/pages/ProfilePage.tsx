import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { useProfileStore, GRADE_LEVEL_LABELS } from "@/stores/profile-store";
import type { GradeLevel } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { getHistory, getHistoryItem } from "@/api/history";
import type { HistoryItem } from "@/api/types";

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
import { Loader2 } from "lucide-react";

export function ProfilePage() {
  const { email, gradeLevel, isSignedIn, isSigningIn, signIn, register, signOut, setGradeLevel } =
    useProfileStore();

  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [error, setError] = useState("");

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    setHistoryLoading(true);
    getHistory()
      .then(setHistoryItems)
      .catch(() => {
        // Silently handle — user may see empty history
      })
      .finally(() => setHistoryLoading(false));
  }, [isSignedIn]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await signIn(emailInput.trim(), passwordInput);
    if (!result.success) setError(result.error ?? "Sign-in failed");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (passwordInput !== confirmPasswordInput) {
      setError("Passwords do not match");
      return;
    }
    const result = await register(emailInput.trim(), passwordInput);
    if (!result.success) setError(result.error ?? "Registration failed");
  }

  async function handleHistoryClick(item: HistoryItem) {
    try {
      const result = await getHistoryItem(item.id);
      setCurrentResult(result);
      navigate("/grade");
    } catch {
      // Could not load result
    }
  }

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
            <div className="space-y-4">
              <div className="flex gap-4 border-b">
                <button
                  type="button"
                  className={`pb-2 text-sm font-medium transition-colors ${
                    mode === "login"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`pb-2 text-sm font-medium transition-colors ${
                    mode === "register"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setMode("register"); setError(""); }}
                >
                  Register
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    minLength={8}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" disabled={isSigningIn}>
                    {isSigningIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    minLength={8}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    minLength={8}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" disabled={isSigningIn}>
                    {isSigningIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isSignedIn && (
        <>
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
                  <SelectValue>{GRADE_LEVEL_LABELS[gradeLevel]}</SelectValue>
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
              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading history...
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No grading history yet. Submit an essay to get started.
                </p>
              ) : (
                <ul className="space-y-2">
                  {historyItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                        onClick={() => handleHistoryClick(item)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {item.overallScore}/{item.maxScore}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.gradedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.essayExcerpt}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
