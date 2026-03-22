import { useState } from "react"
import { Navigate, Link } from "react-router"
import { Loader2 } from "lucide-react"
import { useProfileStore } from "@/stores/profile-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RegistrationWizard } from "@/components/onboarding/RegistrationWizard"

export function RegisterPage() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)
  const gradeLevel = useProfileStore((s) => s.gradeLevel)

  // Phase C: Already onboarded — redirect to /grade
  if (isSignedIn && gradeLevel !== null) {
    return <Navigate to="/grade" replace />
  }

  // Phase B: Signed in but needs onboarding — show wizard
  if (isSignedIn && gradeLevel === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <RegistrationWizard />
      </div>
    )
  }

  // Phase A: Not signed in — show registration form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <RegistrationForm />
    </div>
  )
}

function RegistrationForm() {
  const register = useProfileStore((s) => s.register)
  const isSigningIn = useProfileStore((s) => s.isSigningIn)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const result = await register(email.trim(), password)
    if (!result.success) {
      setError(result.error ?? "Registration failed \u2014 please try again or use a different email.")
    }
    // On success, store sets isSignedIn=true, gradeLevel=null
    // Component re-renders and shows wizard (Phase B)
  }

  return (
    <div className="mx-auto w-[75vw] max-w-3xl rounded-xl bg-card p-8 ring-1 ring-foreground/10 max-sm:w-full">
      <div className="mx-auto max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-balance">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            aria-label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            aria-label="Password"
            placeholder="Password\u2026"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            aria-label="Confirm password"
            placeholder="Confirm password\u2026"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSigningIn} className="w-full">
            {isSigningIn ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                Creating account\u2026
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
