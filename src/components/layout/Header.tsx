import { useState } from "react"
import { NavLink, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MenuIcon, GraduationCapIcon } from "lucide-react"

const navItems = [
  { to: "/", label: "Home" },
  { to: "/grade", label: "Grade" },
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
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4">
        {/* Branding */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-primary"
        >
          <GraduationCapIcon className="size-5" />
          <span>EssayGrader</span>
        </NavLink>

        {/* Desktop navigation */}
        <nav className="hidden gap-1 md:flex">
          {navItems.map((item) => (
            <NavLinkItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSheetOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="size-5" />
            </Button>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-primary">
                  <GraduationCapIcon className="size-5" />
                  EssayGrader
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                  <NavLinkItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    onClick={() => setSheetOpen(false)}
                    className="py-3 text-base"
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
