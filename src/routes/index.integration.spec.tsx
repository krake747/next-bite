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

const unknownStore: StoreSnapshot = { isAuthenticated: false, isLoading: true, isInitializing: true }
const signedOutStore: StoreSnapshot = { isAuthenticated: false, isLoading: false, isInitializing: false }

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

function createLandingRouter(path: string, serverAuth: RouterAuth | null) {
    const authSnapshot = createAuthSnapshot()
    if (serverAuth !== null) {
        authSnapshot.publish(serverAuth)
    }
    return createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: new QueryClient(), authSnapshot },
    })
}

async function renderLanding(serverAuth: RouterAuth | null): Promise<void> {
    const router = createLandingRouter("/", serverAuth)
    await router.load()
    renderDocument(
        <ConvexProvider client={null}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
}

function expectPublicLanding(): void {
    expect(screen.getByRole("heading", { name: "Your friends have good taste." })).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Get started" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("link", { name: "Sign In" }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot="app-nav"]')).not.toBeInTheDocument()
    expect(screen.queryByText("alex@example.com")).not.toBeInTheDocument()
}

const returningUser: RouterAuth = {
    isAuthenticated: true,
    user: { id: "user-1", email: "alex@example.com", name: "Alex", image: null },
}

describe("landing with a server-resolved session", () => {
    test("a signed-out request paints the public landing", async () => {
        await renderLanding(signedOutAuth)

        await waitFor(() => {
            expectPublicLanding()
        })
        expect(screen.getByRole("region", { name: "Sample community activity" })).toBeInTheDocument()
    })

    test("a returning user is sent to the signed-in home before the landing renders", async () => {
        const router = createLandingRouter("/", returningUser)

        await router.load()

        expect(router.state.location.pathname).toBe("/home")
        expect(router.state.matches.some((match) => match.routeId === "/")).toBe(false)
    })

    test("a signed-out request to a protected page is redirected to login with its return path", async () => {
        const router = createLandingRouter("/friends", signedOutAuth)

        await router.load()

        expect(router.state.location.pathname).toBe("/login")
        expect(router.state.location.search).toEqual({ redirect: "/friends" })
    })

    test("a known session overrides a stale cached identity on protected pages", async () => {
        localStorage.setItem("nb:session", JSON.stringify({ id: "old", email: "old@example.com" }))
        const router = createLandingRouter("/friends", signedOutAuth)

        await router.load()

        expect(router.state.location.pathname).toBe("/login")
    })

    test("an unresolved session shows the neutral startup screen, not the landing", async () => {
        storeSnapshot = unknownStore
        await renderLanding(null)

        await waitFor(() => {
            expect(screen.getByRole("status", { name: "Starting Next Bite" })).toBeInTheDocument()
        })
        expect(screen.queryByRole("heading", { name: "Your friends have good taste." })).not.toBeInTheDocument()
        expect(document.querySelector('[data-slot="app-nav"]')).not.toBeInTheDocument()
    })

    test("router context follows client sign-in and sign-out", async () => {
        const router = createLandingRouter("/", signedOutAuth)
        await router.load()
        const authSnapshot = router.options.context?.authSnapshot

        authSnapshot?.publish(returningUser)
        await router.invalidate()
        expect(router.state.location.pathname).toBe("/home")
        expect(router.state.matches[0]?.context.auth).toEqual(returningUser)

        authSnapshot?.publish(signedOutAuth)
        await router.invalidate()
        expect(router.state.location.pathname).toBe("/login")
        expect(router.state.matches[0]?.context.auth).toEqual(signedOutAuth)
    })
})
