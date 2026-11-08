import { useAuth } from "@core/session"
import { AddRestaurantProvider } from "@features/restaurants/add-restaurant-provider"

import { AppNav } from "./app-nav"
import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    // The nav and the top bar are mutually exclusive: signed-in users navigate through AppNav,
    // signed-out visitors get the TopBar sign-in actions instead. The server and the first
    // client render are both auth-unknown (isAuthenticated false), so gating on it alone keeps
    // hydration clean; signed-in users gain the nav as a normal post-hydration update.
    const showNav = auth.isAuthenticated

    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <AddRestaurantProvider>
                {!showNav && <TopBar />}
                <div className="flex flex-1 flex-col md:flex-row">
                    {showNav && <AppNav />}
                    <main className={showNav ? "flex-1 pb-24 md:pb-0" : "flex-1"}>{children}</main>
                </div>
                {!showNav && <Footer />}
            </AddRestaurantProvider>
        </div>
    )
}
