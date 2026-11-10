import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { act, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { createAuthSnapshot } from "@api/auth.session"
import { ConvexProvider, type ConvexAuthPhase } from "@api/convex.context"
import { toId } from "@api/data.model"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../routeTree.gen"

type TestUser = { id: string; email: string; name: string }

const alex: TestUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
const ben: TestUser = { id: "user-2", email: "ben@example.com", name: "Ben" }

let testUser: TestUser = alex

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
            user: testUser,
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

const OWNER_KEY = seedKey("restaurants:get", {})
const FEED_KEY = seedKey("restaurants:feed", {})

function savedBy(user: TestUser, name: string, id: string): RestaurantDoc {
    return {
        _id: toId<"restaurants">(id),
        _creationTime: 1000,
        ownerId: user.id,
        ownerName: user.name,
        name,
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "shared",
        createdAt: 1000,
    }
}

function rememberSession(user: TestUser): void {
    localStorage.setItem("nb:session", JSON.stringify(user))
}

async function renderAt(path: string, rows: ReadonlyArray<RestaurantDoc>) {
    rememberSession(testUser)
    const seeds = new Map<string, unknown>([
        [seedKey("friendships:listFriends", undefined), []],
        [seedKey("friendships:listFriendRequests", undefined), { incoming: [], outgoing: [] }],
    ])
    const backend = createSeededClient({ seeds, liveRows: rows })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient, authSnapshot: createAuthSnapshot() },
    })
    await router.load()
    const tree = (phase: ConvexAuthPhase) => (
        <ConvexProvider client={backend.client} auth={phase}>
            <RouterProvider router={router} />
        </ConvexProvider>
    )
    const view = render(tree("authenticated"))
    return {
        backend,
        router,
        setConvexPhase: (phase: ConvexAuthPhase) => {
            view.rerender(tree(phase))
        },
    }
}

async function waitForFriendsReady(): Promise<void> {
    await waitFor(() => {
        expect(screen.getByText("No friends yet")).toBeInTheDocument()
    })
}

function homeIsMounted(): boolean {
    return document.querySelector('[aria-label="Welcome back"]') !== null
}

function skeletonCount(): number {
    return document.querySelectorAll('[data-slot="skeleton"]').length
}

describe("home route preload", () => {
    beforeEach(() => {
        testUser = alex
        localStorage.clear()
    })

    test("starts owner and feed sync from the route loader before Home mounts", async () => {
        const { backend, router } = await renderAt("/friends", [savedBy(alex, "Trattoria Verde", "r1")])
        await waitForFriendsReady()
        expect(backend.subscribedQueries()).not.toContain(OWNER_KEY)
        expect(backend.subscribedQueries()).not.toContain(FEED_KEY)

        await act(async () => {
            await router.preloadRoute({ to: "/home" })
        })

        expect(backend.subscribedQueries()).toContain(OWNER_KEY)
        expect(backend.subscribedQueries()).toContain(FEED_KEY)
        expect(homeIsMounted()).toBe(false)
    })

    test("returning to home with cached rows keeps the list instead of skeletons", async () => {
        const { router } = await renderAt("/home", [savedBy(alex, "Trattoria Verde", "r1")])
        await waitFor(() => {
            expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        })

        await act(async () => {
            await router.navigate({ to: "/friends" })
        })
        await waitForFriendsReady()
        await act(async () => {
            await router.navigate({ to: "/home" })
        })

        expect(skeletonCount()).toBe(0)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
    })

    test("an account switch never shows the previous user's preloaded rows", async () => {
        const { backend, router, setConvexPhase } = await renderAt("/friends", [savedBy(alex, "Trattoria Verde", "r1")])
        await waitForFriendsReady()
        await act(async () => {
            await router.preloadRoute({ to: "/home" })
        })

        testUser = ben
        rememberSession(ben)
        act(() => {
            setConvexPhase("connecting")
        })
        act(() => {
            backend.pushState([savedBy(ben, "Sushi Bar", "r2")])
        })
        act(() => {
            setConvexPhase("authenticated")
        })
        await waitForFriendsReady()

        await act(async () => {
            await router.navigate({ to: "/home" })
        })

        await waitFor(() => {
            expect(screen.getByText("Sushi Bar")).toBeInTheDocument()
        })
        expect(screen.queryByText("Trattoria Verde")).not.toBeInTheDocument()
    })
})
