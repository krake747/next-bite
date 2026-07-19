import type { ReactNode } from "react"

import { Footer } from "./footer"
import { TopBar } from "./top-bar"

export function PageLayout({ children }: { children: ReactNode }) {
    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <TopBar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
