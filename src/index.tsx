/* @refresh reload */
import { render } from "solid-js/web"
import { RouterProvider } from "@tanstack/solid-router"
import "./index.css"
import { createRouter, createBrowserHistory } from "@tanstack/solid-router"
import { routeTree } from "./routeTree.gen"

const root = document.getElementById("root")
if (!root) {
    throw new Error("Root element not found")
}

const router = createRouter({
    routeTree,
    history: createBrowserHistory(),
})

render(() => <RouterProvider router={router} />, root)
