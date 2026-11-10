import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"

import { pendingOptions } from "@routes/-components/route-pending"

import { routeTree } from "./routeTree.gen"

export function getRouter() {
    const queryClient = new QueryClient()

    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: "intent",
        scrollRestoration: true,
        ...pendingOptions,
    })

    return router
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>
    }
}
