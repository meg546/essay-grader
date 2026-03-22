import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router"
import { MotionConfig } from "motion/react"
import { LandingLayout } from "@/components/layout/LandingLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Layout } from "@/components/layout/Layout"
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react"

const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })))
const GradingPage = lazy(() => import("./pages/GradingPage").then(m => ({ default: m.GradingPage })))
const EssaysPage = lazy(() => import("./pages/EssaysPage").then(m => ({ default: m.EssaysPage })))
const EssayDetailPage = lazy(() => import("./pages/EssayDetailPage").then(m => ({ default: m.EssayDetailPage })))
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })))
const RegisterPage = lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </MotionConfig>
  )
}
