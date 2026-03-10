import { useState } from "react";


import { useProfileStore, GRADE_LEVEL_LABELS } from "@/stores/profile-store";
import type { GradeLevel } from "@/stores/profile-store";


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
  const { email, gradeLevel, isSignedIn, isSigningIn, signIn, signOut, setGradeLevel } =
    useProfileStore();


  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");


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
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                const result = await signIn(emailInput.trim(), passwordInput);
                if (!result.success) setError(result.error ?? "Sign-in failed");
              }}
              className="space-y-3"
            >
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
                minLength={6}
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
              <p className="text-sm text-muted-foreground">
                History will be loaded from the server.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
