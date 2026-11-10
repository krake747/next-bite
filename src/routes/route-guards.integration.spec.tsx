import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { signedOutAuth, type RouterAuth } from "@api/auth.identity"
import { createAuthSnapshot } from "@api/auth.session"
import { ConvexProvider } from "@api/convex.context"

import { routeTree } from "../routeTree.gen"
import { renderDocument } from "../vitest.render"

type StoreSnapshot = {
    readonly isAuthenticated: boolean
    readonly isLoading: boolean
    readonly isInitializing: boolean
}

const signedOutStore: StoreSnapshot = { isAuthenticated: false, isLoading: false, isInitializing: false }
const signedInStore: StoreSnapshot = { isAuthenticated: true, isLoading: false, isInitializing: false }

let storeSnapshot: StoreSnapshot = signedOutStore

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: storeSnapshot.isAuthenticated,
            isLoading: storeSnapshot.isLoading,
            isInitializing: storeSnapshot.isInitializing,
            user: null,
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

afterEach(() => {
    storeSnapshot = signedOutStore
    localStorage.clear()
})

const signedIn: RouterAuth = {
    isAuthenticated: true,
    user: { id: "user-1", email: "alex@example.com", name: "Alex", image: null },
}

function createGuardedRouter(path: string, auth: RouterAuth | null) {
    const authSnapshot = createAuthSnapshot()
    if (auth !== null) {
        authSnapshot.publish(auth)
    }
    return createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: new QueryClient(), authSnapshot },
    })
}

async function settle(path: string, auth: RouterAuth | null) {
    const router = createGuardedRouter(path, auth)
    await router.load()
    return router
}

function matchedRouteIds(router: Awaited<ReturnType<typeof settle>>): ReadonlyArray<string> {
    return router.state.matches.map((match) => match.routeId)
}

describe("signed-in visitors", () => {
    test.each([
        ["/", "/home"],
        ["/login", "/home"],
        ["/signup", "/home"],
        ["/login?redirect=%2Fgroups%2Fg1", "/groups/g1"],
        ["/signup?redirect=%2Finvite%2Ftoken-1", "/invite/token-1"],
    ])("%s goes to %s before the page loads", async (path, destination) => {
        const router = await settle(path, signedIn)

        expect(router.state.location.pathname).toBe(destination)
        expect(matchedRouteIds(router)).not.toContain("/login")
        expect(matchedRouteIds(router)).not.toContain("/signup")
        expect(matchedRouteIds(router)).not.toContain("/")
    })

    test.each(["//evil.example", "https://evil.example/home", "/settings", "javascript:alert(1)"])(
        "an unsafe return path %s falls back to /home",
        async (unsafe) => {
            const router = await settle(`/login?redirect=${encodeURIComponent(unsafe)}`, signedIn)

            expect(router.state.location.pathname).toBe("/home")
        },
    )

    test.each(["/home", "/friends", "/groups", "/you"])("%s stays put", async (path) => {
        const router = await settle(path, signedIn)

        expect(router.state.location.pathname).toBe(path)
    })
})

describe("signed-out visitors", () => {
    test.each(["/home", "/friends", "/groups", "/you"])(
        "%s redirects to login with its return path before the page loads",
        async (path) => {
            const router = await settle(path, signedOutAuth)

            expect(router.state.location.pathname).toBe("/login")
            expect(router.state.location.search).toEqual({ redirect: path })
            expect(matchedRouteIds(router).some((id) => id.startsWith("/_app"))).toBe(false)
        },
    )

    test.each(["/", "/login", "/signup"])("%s stays public", async (path) => {
        const router = await settle(path, signedOutAuth)

        expect(router.state.location.pathname).toBe(path)
    })

    test("an invite preview stays open without a session", async () => {
        const router = await settle("/invite/token-1", signedOutAuth)

        expect(router.state.location.pathname).toBe("/invite/token-1")
        expect(matchedRouteIds(router)).toContain("/_app/invite/$token")
    })

    test("a cached identity in storage does not open a protected page", async () => {
        localStorage.setItem("nb:session", JSON.stringify({ id: "user-1", email: "alex@example.com" }))

        const router = await settle("/friends", signedOutAuth)

        expect(router.state.location.pathname).toBe("/login")
    })

    test("a protected page never mounts before the login redirect", async () => {
        const router = createGuardedRouter("/friends", signedOutAuth)
        await router.load()
        renderDocument(
            <ConvexProvider client={null}>
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
        })
        expect(document.querySelector('[data-slot="app-nav"]')).not.toBeInTheDocument()
        expect(screen.queryByRole("heading", { name: "Friends" })).not.toBeInTheDocument()
    })
})

describe("a session the server could not resolve", () => {
    test("a protected page waits for the client session, then the route redirects", async () => {
        const router = await settle("/friends", null)
        expect(router.state.location.pathname).toBe("/friends")

        router.options.context?.authSnapshot.publish(signedOutAuth)
        await router.invalidate()

        expect(router.state.location.pathname).toBe("/login")
        expect(router.state.location.search).toEqual({ redirect: "/friends" })
    })

    test("the landing shows the startup screen for a signed-in client and leaves the redirect to the route", async () => {
        storeSnapshot = signedInStore
        const router = createGuardedRouter("/", null)
        await router.load()
        renderDocument(
            <ConvexProvider client={null}>
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        await waitFor(() => {
            expect(screen.getByRole("status", { name: "Starting Next Bite" })).toBeInTheDocument()
        })
        expect(screen.queryByRole("heading", { name: "Your friends have good taste." })).not.toBeInTheDocument()
        expect(router.state.location.pathname).toBe("/")

        router.options.context?.authSnapshot.publish(signedIn)
        await router.invalidate()

        expect(router.state.location.pathname).toBe("/home")
    })
})
