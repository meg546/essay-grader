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
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-primary"
          >
            <GraduationCapIcon className="size-5" />
            <span>EssayGrader</span>
          </NavLink>

          <Button variant="outline" size="sm" onClick={handleSignInClick}>
            Sign In
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
