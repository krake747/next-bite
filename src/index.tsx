import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, createRouter, createBrowserHistory } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

import "./fonts.css"
import "./index.css"

const rootEl = document.getElementById("root")
if (!rootEl) {
    throw new Error("Root element not found")
}

const router = createRouter({
    routeTree,
    history: createBrowserHistory(),
})

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

createRoot(rootEl).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
