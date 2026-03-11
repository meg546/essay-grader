import { useState } from "react";

import {
  useProfileStore,
  GRADE_LEVEL_LABELS,
  WRITING_PURPOSE_LABELS,
} from "@/stores/profile-store";
import type { GradeLevel, WritingPurpose } from "@/stores/profile-store";

import { Button } from "@/components/ui/button";
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

import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

export function ProfilePage() {
  const { email, gradeLevel, writingPurpose, signOut, setGradeLevel, setWritingPurpose } =
    useProfileStore();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-balance">Profile</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{email}</p>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">********</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Grade Level</label>
            <Select
              value={gradeLevel ?? ""}
              onValueChange={(v) => setGradeLevel(v as GradeLevel)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select grade level">
                  {gradeLevel ? GRADE_LEVEL_LABELS[gradeLevel] : "Select grade level"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GRADE_LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-muted-foreground">
              Used when no rubric is provided to calibrate feedback to your level.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Writing Purpose</label>
            <Select
              value={writingPurpose ?? ""}
              onValueChange={(v) => setWritingPurpose(v as WritingPurpose)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select purpose">
                  {writingPurpose ? WRITING_PURPOSE_LABELS[writingPurpose] : "Select purpose"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WRITING_PURPOSE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteAccountOpen(true)}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
      />
    </div>
  );
}
