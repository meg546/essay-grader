import { BrowserRouter, Routes, Route } from "react-router"
import { Layout } from "@/components/layout/Layout"
import { LandingPage } from "@/pages/LandingPage"
import { GradingPage } from "@/pages/GradingPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/grade" element={<GradingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
