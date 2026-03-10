import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { useProfileStore } from "@/stores/profile-store"
import { SignInDialog } from "@/components/auth/SignInDialog"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeatureHighlights } from "@/components/landing/FeatureHighlights"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { WalkthroughDemo } from "@/components/landing/WalkthroughDemo"
import { Footer } from "@/components/landing/Footer"

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
      <HeroSection
        onSignIn={() => setShowSignIn(true)}
        onRegister={() => navigate("/register")}
      />
      <FeatureHighlights />
      <HowItWorks />
      <WalkthroughDemo />
      <Footer />

      <SignInDialog
        open={showSignIn}
        onOpenChange={setShowSignIn}
        onAuthenticated={handleAuthenticated}
      />
    </>
  )
}
