export function ResultsPage() {
  return (
    <div className="space-y-6">
      {/* Page title skeleton */}
      <div className="h-8 w-40 rounded-lg bg-muted" />

      {/* Summary paragraph area */}
      <div className="space-y-2 rounded-xl bg-card p-6 shadow-sm">
        <div className="h-5 w-32 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded-lg bg-muted" />
        <div className="h-4 w-5/6 rounded-lg bg-muted" />
        <div className="h-4 w-3/4 rounded-lg bg-muted" />
      </div>

      {/* Score bars */}
      <div className="space-y-4">
        <div className="h-5 w-24 rounded-lg bg-muted" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 shrink-0 rounded-lg bg-muted" />
            <div className="h-6 w-4/5 rounded-lg bg-primary/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 shrink-0 rounded-lg bg-muted" />
            <div className="h-6 w-3/5 rounded-lg bg-primary/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 shrink-0 rounded-lg bg-muted" />
            <div className="h-6 w-11/12 rounded-lg bg-primary/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 shrink-0 rounded-lg bg-muted" />
            <div className="h-6 w-2/3 rounded-lg bg-primary/20" />
          </div>
        </div>
      </div>

      {/* Expandable feedback sections (stacked cards) */}
      <div className="space-y-3">
        <div className="h-5 w-36 rounded-lg bg-muted" />
        <div className="h-16 rounded-xl bg-card shadow-sm" />
        <div className="h-16 rounded-xl bg-card shadow-sm" />
        <div className="h-16 rounded-xl bg-card shadow-sm" />
        <div className="h-16 rounded-xl bg-card shadow-sm" />
      </div>
    </div>
  )
}
