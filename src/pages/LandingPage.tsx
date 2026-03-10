import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { useProfileStore } from "@/stores/profile-store"
import { SignInDialog } from "@/components/auth/SignInDialog"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)
  const navigate = useNavigate()
  const [showSignIn, setShowSignIn] = useState(false)

  // Redirect authenticated users to /grade instantly
  useEffect(() => {
    if (isSignedIn) {
      navigate("/grade", { replace: true })
    }
  }, [isSignedIn, navigate])

  // Listen for the custom open-sign-in event from LandingLayout header button
  useEffect(() => {
    function handleOpenSignIn() {
      setShowSignIn(true)
    }
    document.addEventListener("open-sign-in", handleOpenSignIn)
    return () => document.removeEventListener("open-sign-in", handleOpenSignIn)
  }, [])

  const handleAuthenticated = useCallback(() => {
    setShowSignIn(false)
    navigate("/grade", { replace: true })
  }, [navigate])

  // Prevent flash for authenticated users
  if (isSignedIn) {
    return null
  }

  return (
    <>
      {/* Hero section */}
      <section className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          EssayGrader
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          AI-powered essay feedback
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" onClick={() => setShowSignIn(true)}>
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </div>
      </section>

      {/* TODO: Feature highlights section (Plan 02) */}
      {/* TODO: How-it-works section (Plan 02) */}
      {/* TODO: Animated walkthrough demo (Plan 02) */}
      {/* TODO: Footer (Plan 02) */}

      <SignInDialog
        open={showSignIn}
        onOpenChange={setShowSignIn}
        onAuthenticated={handleAuthenticated}
      />
    </>
  )
}
