import { Navigate, Outlet } from "react-router"
import { useProfileStore } from "@/stores/profile-store"

export function ProtectedRoute() {
  const isSignedIn = useProfileStore((s) => s.isSignedIn)

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
