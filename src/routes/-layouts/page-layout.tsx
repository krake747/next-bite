import { useAuth } from "@core/session"

import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    const showNav = auth.isAuthenticated

    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            {!showNav && <TopBar />}
            {showNav ? children : <main className="flex-1">{children}</main>}
            {!showNav && <Footer />}
        </div>
    )
}
