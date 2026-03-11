import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useProfileStore } from "@/stores/profile-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}

export function SignInDialog({ open, onOpenChange, onAuthenticated }: SignInDialogProps) {
  const { signIn, register, isSigningIn } = useProfileStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [error, setError] = useState("");

  // Reset form state when dialog closes
  useEffect(() => {
    if (!open) {
      setEmailInput("");
      setPasswordInput("");
      setConfirmPasswordInput("");
      setError("");
      setMode("login");
    }
  }, [open]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await signIn(emailInput.trim(), passwordInput);
    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error ?? "Sign-in failed");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (passwordInput !== confirmPasswordInput) {
      setError("Passwords do not match");
      return;
    }
    const result = await register(emailInput.trim(), passwordInput);
    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error ?? "Registration failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            You need an account to grade essays.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex gap-4 border-b">
            <button
              type="button"
              className={`pb-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
              className={`pb-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
              <Button type="submit" disabled={isSigningIn} className="w-full">
                {isSigningIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
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
              <Button type="submit" disabled={isSigningIn} className="w-full">
                {isSigningIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
