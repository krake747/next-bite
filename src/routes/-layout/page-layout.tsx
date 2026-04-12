import type { JSX } from "solid-js"
import { TopBar } from "./top-bar"
import { Footer } from "./footer"

export function PageLayout(props: { children: JSX.Element }) {
    return (
        <div data-component="page-layout" class="flex min-h-screen flex-col">
            <TopBar />
            <main class="flex-1">{props.children}</main>
            <Footer />
        </div>
    )
}
