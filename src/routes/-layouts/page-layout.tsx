import { useState } from "react"

import { useAuth } from "@core/hooks"
import { AddRestaurantDialog } from "@features/restaurants/add-restaurant-dialog"

import { AppNav } from "./app-nav"
import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    // The nav is signed-in only. The server and the first client render are both
    // auth-unknown (isAuthenticated false), so gating on it alone keeps hydration clean;
    // signed-in users gain the nav as a normal post-hydration update.
    const showNav = auth.isAuthenticated

    const handleAddClick = () => {
        setShowAdd(true)
    }

    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <TopBar />
            <div className="flex flex-1 flex-col md:flex-row">
                {showNav && <AppNav onAddClick={handleAddClick} />}
                <main className={showNav ? "flex-1 pb-24 md:pb-0" : "flex-1"}>{children}</main>
            </div>
            <Footer />
            {auth.isAuthenticated && <AddRestaurantDialog show={showAdd} onOpenChange={setShowAdd} />}
        </div>
    )
}
