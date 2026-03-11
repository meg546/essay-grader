import { PenTool } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <PenTool aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Redpen
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          AI-powered essay feedback
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Redpen. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
