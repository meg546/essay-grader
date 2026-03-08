export function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Page title skeleton */}
      <div className="h-8 w-52 rounded-lg bg-muted" />

      {/* Data table skeleton */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header row */}
        <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/6 rounded bg-muted" />
          <div className="h-4 w-1/6 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>

        {/* Data rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/6 rounded bg-muted" />
            <div className="h-4 w-1/6 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
