import { Outlet } from "react-router"
import { NavLink } from "react-router"
import { PenToolIcon, Sun, Moon, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet"

export function LandingLayout() {
  const { resolvedTheme, toggleTheme } = useTheme()

  function handleSignInClick() {
    document.dispatchEvent(new CustomEvent("open-sign-in"))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-primary"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-xl font-semibold text-primary"
          >
            <PenToolIcon aria-hidden="true" className="size-6" />
            <span>Redpen</span>
          </NavLink>

          <div className="flex items-center gap-2">
            {/* Theme toggle — always visible */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              {resolvedTheme === "light" ? (
                <Sun aria-hidden="true" className="size-5" />
              ) : (
                <Moon aria-hidden="true" className="size-5" />
              )}
            </button>

            {/* Desktop Sign In */}
            <Button variant="outline" size="default" className="hidden md:inline-flex" onClick={handleSignInClick}>
              Sign In
            </Button>

            {/* Mobile hamburger with Sign In inside */}
            <div className="flex md:hidden">
              <Sheet>
                <SheetTrigger
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open menu"
                >
                  <Menu aria-hidden="true" className="size-5" />
                </SheetTrigger>
                <SheetContent side="right" className="pt-12">
                  <div className="flex flex-col gap-3 px-4">
                    <Button variant="outline" size="default" onClick={handleSignInClick}>
                      Sign In
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
