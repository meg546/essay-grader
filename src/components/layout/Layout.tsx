import { Outlet } from "react-router"
import { Header } from "./Header"

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
