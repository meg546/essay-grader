import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { LandingLayout } from "@/components/layout/LandingLayout"
import { LandingPage } from "@/pages/LandingPage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Layout } from "@/components/layout/Layout"
import { GradingPage } from "@/pages/GradingPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/grade" element={<GradingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="/register" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
