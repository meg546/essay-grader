export function LandingPage() {
  return (
    <div className="space-y-8">
      {/* Hero section skeleton */}
      <div className="space-y-4 py-8">
        <div className="mx-auto h-10 w-72 rounded-lg bg-muted" />
        <div className="mx-auto h-5 w-96 max-w-full rounded-lg bg-muted" />
        <div className="mx-auto h-5 w-80 max-w-full rounded-lg bg-muted" />
      </div>

      {/* Description area skeleton */}
      <div className="mx-auto max-w-xl space-y-3">
        <div className="h-4 w-full rounded-lg bg-muted" />
        <div className="h-4 w-5/6 rounded-lg bg-muted" />
        <div className="h-4 w-4/6 rounded-lg bg-muted" />
      </div>

      {/* CTA button skeleton */}
      <div className="flex justify-center pt-4">
        <div className="h-12 w-48 rounded-xl bg-primary/20" />
      </div>

      {/* Feature cards skeleton */}
      <div className="grid gap-6 pt-8 sm:grid-cols-3">
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
