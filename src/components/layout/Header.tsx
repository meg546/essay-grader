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

        {/* Navigation */}
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const label = item.to === "/grade" && essayText.trim() !== ""
              ? "Draft"
              : item.label
            return <NavLinkItem key={item.to} to={item.to} label={label} />
          })}
        </nav>
      </div>
    </header>
  )
}
