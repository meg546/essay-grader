import { BrowserRouter, Routes, Route } from "react-router"
import { LandingLayout } from "@/components/layout/LandingLayout"
import { LandingPage } from "@/pages/LandingPage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Layout } from "@/components/layout/Layout"
import { GradingPage } from "@/pages/GradingPage"
import { EssaysPage } from "@/pages/EssaysPage"
import { EssayDetailPage } from "@/pages/EssayDetailPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { RegisterPage } from "@/pages/RegisterPage"
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
              <Route path="/history" element={<EssaysPage />} />
              <Route path="/history/:id" element={<EssayDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
