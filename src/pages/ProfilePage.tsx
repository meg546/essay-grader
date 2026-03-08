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
