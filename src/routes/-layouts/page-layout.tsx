import { useState } from "react"

import { useAuth } from "@core/hooks"
import { AddRestaurantDialog } from "@features/restaurants/add-restaurant-dialog"

import { AppNav } from "./app-nav"
import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    const [showAdd, setShowAdd] = useState(false)

    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <TopBar />
            <div className="flex flex-1 flex-col md:flex-row">
                <AppNav
                    onAddClick={() => {
                        setShowAdd(true)
                    }}
                />
                <main className="flex-1 pb-24 md:pb-0">{children}</main>
            </div>
            <Footer />
            {auth.isAuthenticated && <AddRestaurantDialog show={showAdd} onOpenChange={setShowAdd} />}
        </div>
    )
}
