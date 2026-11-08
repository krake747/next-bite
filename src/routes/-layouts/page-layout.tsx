import { useAuth } from "@core/session"
import { AddRestaurantProvider } from "@features/restaurants/add-restaurant-provider"

import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    // The nav lives in each area's own -layout shell (AppShell for _app,
    // DsShell for ds). The top bar and footer are mutually exclusive with
    // those shells: signed-out visitors get TopBar and Footer instead. The
    // server and the first client render are both auth-unknown
    // (isAuthenticated false), so gating on it alone keeps hydration clean;
    // signed-in users gain their shell as a normal post-hydration update.
    const showNav = auth.isAuthenticated

    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <AddRestaurantProvider>
                {!showNav && <TopBar />}
                {showNav ? children : <main className="flex-1">{children}</main>}
                {!showNav && <Footer />}
            </AddRestaurantProvider>
        </div>
    )
}
