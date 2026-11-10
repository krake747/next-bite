import {
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router"
import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test } from "vitest"

import { pendingOptions, RouteProgress } from "./route-pending"

async function wait(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

function buildRouter(loaderMs: Readonly<Record<"fast" | "slow", number>>) {
    const rootRoute = createRootRoute({
        component: () => (
            <>
                <RouteProgress />
                <nav aria-label="App chrome">chrome</nav>
                <Outlet />
            </>
        ),
    })
    const startRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => <p>Start page</p>,
    })
    const fastRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/fast",
        loader: async () => {
            await wait(loaderMs.fast)
        },
        component: () => <p>Fast page</p>,
    })
    const slowRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/slow",
        loader: async () => {
            await wait(loaderMs.slow)
        },
        component: () => <p>Slow page</p>,
    })
    return createRouter({
        routeTree: rootRoute.addChildren([startRoute, fastRoute, slowRoute]),
        history: createMemoryHistory({ initialEntries: ["/"] }),
        ...pendingOptions,
    })
}

type Seen = { pending: boolean; progress: boolean; stop: () => void }

function watchLoadingUi(): Seen {
    const seen: Seen = { pending: false, progress: false, stop: () => {} }
    const check = () => {
        seen.pending ||= document.querySelector('[data-slot="section-loading"]') !== null
        seen.progress ||= document.querySelector('[data-slot="route-progress"]') !== null
    }
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    seen.stop = () => {
        observer.disconnect()
    }
    return seen
}

async function mount(loaderMs: Readonly<Record<"fast" | "slow", number>>) {
    const router = buildRouter(loaderMs)
    await router.load()
    render(<RouterProvider router={router} />)
    await screen.findByText("Start page")
    return router
}

let seen: Seen | undefined

afterEach(() => {
    seen?.stop()
    seen = undefined
})

describe("route pending UI", () => {
    test("a fast navigation shows no pending UI and no progress bar", async () => {
        const router = await mount({ fast: 50, slow: 1200 })
        seen = watchLoadingUi()

        act(() => {
            router.history.push("/fast")
        })

        expect(await screen.findByText("Fast page")).toBeInTheDocument()
        expect(seen.pending).toBe(false)
        expect(seen.progress).toBe(false)
    })

    test("a slow navigation keeps the current page first, then shows localized pending UI and a progress bar", async () => {
        const router = await mount({ fast: 50, slow: 1200 })
        const chrome = screen.getByRole("navigation", { name: "App chrome" })
        act(() => {
            router.history.push("/slow")
        })
        await act(async () => {
            await wait(200)
        })
        expect(screen.getByText("Start page")).toBeInTheDocument()
        expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument()

        expect(await screen.findByRole("status", { name: "Loading" })).toBeInTheDocument()
        expect(await screen.findByRole("progressbar", { name: "Loading page" })).toBeInTheDocument()
        expect(chrome).toBeInTheDocument()

        expect(await screen.findByText("Slow page")).toBeInTheDocument()
        expect(screen.queryByRole("progressbar", { name: "Loading page" })).not.toBeInTheDocument()
        expect(screen.getByRole("navigation", { name: "App chrome" })).toBe(chrome)
    })
})
