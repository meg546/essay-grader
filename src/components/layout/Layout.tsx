import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router"
import { Header } from "./Header"
import { useAppStore } from "@/stores/app-store"

export function Layout() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const wasOnGrade = prevPathRef.current === "/grade";
    const isOnGrade = location.pathname === "/grade";
    const { timerEndTime, timerPaused, pauseTimer, resumeTimer } = useAppStore.getState();

    if (wasOnGrade && !isOnGrade && timerEndTime && !timerPaused) {
      pauseTimer();
    } else if (!wasOnGrade && isOnGrade && timerPaused) {
      resumeTimer();
    }

    prevPathRef.current = location.pathname;
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-primary"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
