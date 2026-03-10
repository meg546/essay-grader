import { Navigate, Outlet } from "react-router"
import { useProfileStore } from "@/stores/profile-store"

export function ProtectedRoute() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)
  const gradeLevel = useProfileStore((s) => s.gradeLevel)

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  // Wizard gate: force onboarding completion before accessing protected routes
  if (gradeLevel === null) {
    return <Navigate to="/register" replace />
  }

  return <Outlet />
}
