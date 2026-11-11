import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { toId } from "@api/data.model"
import { type PlaceCard } from "@api/db/restaurants"
import { createSeededClient, seedKey } from "@api/db/seeded.client"
import { pendingOptions } from "@routes/-components/route-pending"

import { routeTree } from "../routeTree.gen"
import { authSnapshotFor } from "../vitest.auth"

const alex = { id: "user-1", email: "alex@example.com", name: "Alex" }

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: true,
            isLoading: false,
            user: alex,
            error: null,
            initializeAuth: noop,
            signInWithPassword: noop,
            signUpWithPassword: noop,
            requestOtp: noop,
            verifyOtp: noop,
            signOut: noop,
        }),
    }
})

const restaurantId = toId<"places">("r1")

const verde: PlaceCard = {
    _id: restaurantId,
    _creationTime: 1000,
    ownerId: toId<"profiles">(alex.id),
    ownerName: alex.name,
    name: "Trattoria Verde",
    cuisine: "Italian",
    address: { label: "Luxembourg City" },
    photos: [],
    mySave: null,
    wantCount: 0,
}

type Gate = { promise: Promise<void>; open: () => void }

function closedGate(): Gate {
    let open = () => {}
    const promise = new Promise<void>((resolve) => {
        open = resolve
    })
    return { promise, open }
}

let gate: Gate | undefined

async function renderAt(path: string) {
    const seeds = new Map<string, unknown>([
        [seedKey("places:get", { id: restaurantId }), verde],
        [seedKey("social:friends", undefined), []],
        [seedKey("social:requests", undefined), { incoming: [], outgoing: [] }],
    ])
    const backend = createSeededClient({
        seeds,
        queryGate: async () => {
            await gate?.promise
        },
    })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(alex) },
        ...pendingOptions,
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client} auth="authenticated">
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    return router
}

function appShell(): Element {
    const nav = document.querySelector('[data-slot="app-shell"]')
    if (nav === null) {
        throw new Error("app shell is not mounted")
    }
    return nav
}

function appIsInitializing(): boolean {
    return document.querySelector('[data-slot="app-initializing"]') !== null
}

function detailIsPending(): boolean {
    return (
        document.querySelector('[data-slot="back-nav"]') !== null &&
        screen.queryByRole("heading", { name: "Trattoria Verde" }) === null
    )
}

async function homeIsReady(): Promise<void> {
    await waitFor(() => {
        expect(document.querySelector('[aria-label="Welcome back"]')).toBeInTheDocument()
    })
}

describe("authenticated navigation pending UI", () => {
    beforeEach(() => {
        gate = undefined
        localStorage.clear()
    })

    afterEach(() => {
        gate?.open()
    })

    test("moving between authenticated pages keeps the same shell mounted", async () => {
        const router = await renderAt("/home")
        await homeIsReady()
        const nav = appShell()

        await act(async () => {
            await router.navigate({ to: "/friends" })
        })
        await waitFor(() => {
            expect(screen.getByText("No friends yet")).toBeInTheDocument()
        })

        expect(appShell()).toBe(nav)
        expect(appIsInitializing()).toBe(false)
    })

    test("a slow detail wait shows localized pending UI inside the shell", async () => {
        const router = await renderAt("/home")
        await homeIsReady()
        const nav = appShell()
        gate = closedGate()

        await act(async () => {
            await router.navigate({ to: "/restaurants/$restaurantId", params: { restaurantId } })
        })

        await waitFor(() => {
            expect(detailIsPending()).toBe(true)
        })
        expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
        expect(appShell()).toBe(nav)
        expect(appIsInitializing()).toBe(false)

        await act(async () => {
            gate?.open()
            await gate?.promise
        })

        expect(await screen.findByRole("heading", { name: "Trattoria Verde" })).toBeInTheDocument()
        expect(detailIsPending()).toBe(false)
        expect(appShell()).toBe(nav)
    })
})
