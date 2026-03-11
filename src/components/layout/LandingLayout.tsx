import { Outlet } from "react-router"
import { NavLink } from "react-router"
import { GraduationCapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingLayout() {
  function handleSignInClick() {
    document.dispatchEvent(new CustomEvent("open-sign-in"))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-xl font-semibold text-primary"
          >
            <GraduationCapIcon aria-hidden="true" className="size-6" />
            <span>EssayGrader</span>
          </NavLink>

          <Button variant="outline" size="default" onClick={handleSignInClick}>
            Sign In
          </Button>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
