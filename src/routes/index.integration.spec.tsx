import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"

import { routeTree } from "../routeTree.gen"

type AuthSnapshot = {
    readonly isAuthenticated: boolean
    readonly isLoading: boolean
}

// Server auth is unknown: isLoading true, signed out, no user. The first client
// render matches that snapshot, so this is the public HTML the crawler sees.
let authSnapshot: AuthSnapshot = { isAuthenticated: false, isLoading: true }

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: authSnapshot.isAuthenticated,
            isLoading: authSnapshot.isLoading,
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
    authSnapshot = { isAuthenticated: false, isLoading: true }
})

async function renderLanding(): Promise<void> {
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
        context: { queryClient: new QueryClient() },
    })
    await router.load()
    render(
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

describe("signed-out landing without a convex client", () => {
    test("renders public landing content while auth is unknown", async () => {
        await renderLanding()

        // The server has no session and the Convex client is null. The landing
        // must still be in the document, or raw HTML is only a loading status.
        await waitFor(() => {
            expectPublicLanding()
        })
        expect(screen.getByRole("region", { name: "Sample community activity" })).toBeInTheDocument()
    })

    test("keeps the public landing after auth resolves signed out", async () => {
        authSnapshot = { isAuthenticated: false, isLoading: false }
        await renderLanding()

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Your friends have good taste." })).toBeInTheDocument()
        })
        expectPublicLanding()
    })
})
