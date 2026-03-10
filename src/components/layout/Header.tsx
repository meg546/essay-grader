import { NavLink, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { GraduationCapIcon } from "lucide-react"
import { useAppStore } from "@/stores/app-store"

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
  showDot,
}: {
  to: string
  label: string
  onClick?: () => void
  className?: string
  showDot?: boolean
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
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <span className="relative">
        {label}
        {showDot && (
          <span className="absolute -right-2 -top-0.5 h-2 w-2 rounded-full bg-green-500" />
        )}
      </span>
    </NavLink>
  )
}

export function Header() {
  const essayText = useAppStore((s) => s.essayText)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Branding */}
        <NavLink
          to="/grade"
          className="flex items-center gap-2 text-lg font-semibold text-primary"
        >
          <GraduationCapIcon className="size-5" />
          <span>EssayGrader</span>
        </NavLink>

        {/* Navigation */}
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLinkItem key={item.to} to={item.to} label={item.label} showDot={item.to === "/grade" && essayText.trim() !== ""} />
          ))}
        </nav>
      </div>
    </header>
  )
}
