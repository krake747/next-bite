import type { ReactNode } from "react"
import { TopBar } from "./top-bar"
import { Footer } from "./footer"

export function PageLayout({ children }: { children: ReactNode }) {
    return (
        <div data-component="page-layout" className="flex min-h-screen flex-col">
            <TopBar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
