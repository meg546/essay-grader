import { BrowserRouter, Routes, Route } from "react-router"
import { Layout } from "@/components/layout/Layout"
import { GradingPage } from "@/pages/GradingPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<GradingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
