import { Outlet } from "react-router"
import { Header } from "./Header"

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
