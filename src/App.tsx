import { BrowserRouter, Routes, Route } from "react-router"
import { Layout } from "@/components/layout/Layout"
import { LandingPage } from "@/pages/LandingPage"
import { GradingPage } from "@/pages/GradingPage"
import { ResultsPage } from "@/pages/ResultsPage"
import { HistoryPage } from "@/pages/HistoryPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/grade" element={<GradingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
