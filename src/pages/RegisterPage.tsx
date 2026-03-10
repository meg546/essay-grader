import { Link } from "react-router"
import { Button } from "@/components/ui/button"

export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-2xl font-bold text-foreground">Registration</h1>
      <p className="text-muted-foreground">
        Registration is coming soon. Check back later!
      </p>
      <Button variant="outline" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
