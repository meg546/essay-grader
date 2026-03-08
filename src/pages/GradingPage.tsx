export function GradingPage() {
  return (
    <div className="space-y-6">
      {/* Page title skeleton */}
      <div className="h-8 w-48 rounded-lg bg-muted" />

      {/* Textarea + rubric grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Essay textarea area */}
        <div className="space-y-3">
          <div className="h-5 w-24 rounded-lg bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
          <div className="flex gap-3">
            <div className="h-4 w-20 rounded-lg bg-muted" />
            <div className="h-4 w-20 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Rubric rows */}
        <div className="space-y-3">
          <div className="h-5 w-32 rounded-lg bg-muted" />
          <div className="h-14 rounded-lg bg-muted" />
          <div className="h-14 rounded-lg bg-muted" />
          <div className="h-14 rounded-lg bg-muted" />
          <div className="h-14 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Submit button skeleton */}
      <div className="h-12 w-44 rounded-xl bg-primary/20" />
    </div>
  )
}
