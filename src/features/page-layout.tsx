import type { JSX } from "solid-js"
import { TopBar } from "../features/top-bar"
import { Footer } from "../features/footer"

export function PageLayout(props: { children: JSX.Element }) {
    return (
        <div class="flex min-h-screen flex-col">
            <TopBar />
            <main class="flex-1">{props.children}</main>
            <Footer />
        </div>
    )
}
