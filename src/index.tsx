/* @refresh reload */
import { render } from "solid-js/web"
import { RouterProvider, createRouter, createBrowserHistory } from "@tanstack/solid-router"
import { routeTree } from "./routeTree.gen"

import "./fonts.css"
import "./index.css"

const root = document.getElementById("root")
if (!root) {
    throw new Error("Root element not found")
}

const router = createRouter({
    routeTree,
    history: createBrowserHistory(),
})

declare module "@tanstack/solid-router" {
    interface Register {
        router: typeof router
    }
}

render(() => <RouterProvider router={router} />, root)
