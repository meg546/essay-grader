import { NavLink, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { GraduationCapIcon } from "lucide-react"

const navItems = [
  { to: "/", label: "Home" },
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
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)

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
      {label}
    </NavLink>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Branding */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-primary"
        >
          <GraduationCapIcon className="size-5" />
          <span>EssayGrader</span>
        </NavLink>

        {/* Navigation */}
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLinkItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
      </div>
    </header>
  )
}
