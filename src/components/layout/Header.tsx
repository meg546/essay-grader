import { NavLink, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { GraduationCapIcon, Sun, Moon, Menu } from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { useTheme } from "@/lib/theme"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet"

const navItems = [
  { to: "/grade", label: "Home" },
  { to: "/history", label: "Essays" },
  { to: "/profile", label: "Profile" },
] as const

function NavLinkItem({
  to,
  label,
  onClick,
  className,
}: {
  to: string
  label: string
  onClick?: () => void
  className?: string
}) {
  const location = useLocation()
  const isActive =
    to === "/grade"
      ? location.pathname === "/grade" || location.pathname.startsWith("/grade")
      : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2.5 text-base font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {label}
    </NavLink>
  )
}

export function Header() {
  const essayText = useAppStore((s) => s.essayText)
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-5">
        {/* Branding */}
        <NavLink
          to="/grade"
          className="flex items-center gap-2.5 text-xl font-semibold text-primary"
        >
          <GraduationCapIcon aria-hidden="true" className="size-6" />
          <span>EssayGrader</span>
        </NavLink>

        {/* Right side: theme toggle + desktop nav + mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Theme toggle — always visible */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {resolvedTheme === "light" ? (
              <Sun aria-hidden="true" className="size-5" />
            ) : (
              <Moon aria-hidden="true" className="size-5" />
            )}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const label = item.to === "/grade" && essayText.trim() !== ""
                ? "Draft"
                : item.label
              return <NavLinkItem key={item.to} to={item.to} label={label} />
            })}
          </nav>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Open menu"
              >
                <Menu aria-hidden="true" className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="pt-12">
                <nav className="flex flex-col gap-1 px-4">
                  {navItems.map((item) => {
                    const label = item.to === "/grade" && essayText.trim() !== ""
                      ? "Draft"
                      : item.label
                    return (
                      <NavLinkItem
                        key={item.to}
                        to={item.to}
                        label={label}
                        className="w-full text-left"
                      />
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
