import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { createAuthSnapshot } from "@api/auth.session"
import { ConvexProvider } from "@api/convex.context"
import { createSeededClient } from "@api/db/seeded.client"

import { routeTree } from "../../../routeTree.gen"

type AuthState = {
    readonly isAuthenticated: boolean
    readonly isLoading: boolean
    readonly isInitializing: boolean
    readonly user: { id: string; email: string; name: string } | null
}

let authState: AuthState = { isAuthenticated: false, isLoading: true, isInitializing: true, user: null }

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: authState.isAuthenticated,
            isLoading: authState.isLoading,
            isInitializing: authState.isInitializing,
            user: authState.user,
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

async function renderShell(): Promise<void> {
    const backend = createSeededClient({})
    const authSnapshot = createAuthSnapshot()
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/home"] }),
        context: { queryClient: backend.queryClient, authSnapshot },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client} auth="connecting">
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
}

describe("responsive nav chrome", () => {
    test("renders mobile tabs and sidebar together; CSS picks the visible one", async () => {
        authState = {
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            user: { id: "user-1", email: "alex@example.com", name: "Alex" },
        }
        await renderShell()

        expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(2)
        expect(screen.getByRole("link", { name: "Next Bite home" })).toBeInTheDocument()
    })
})

describe("sidebar account menu", () => {
    test("shows a neutral loading state while auth initializes", async () => {
        authState = { isAuthenticated: false, isLoading: true, isInitializing: true, user: null }
        await renderShell()

        expect(screen.getByRole("status", { name: "Loading account" })).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Open account menu" })).toBeNull()
    })

    test("shows the session identity once auth resolves", async () => {
        authState = {
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            user: { id: "user-1", email: "alex@example.com", name: "Alex" },
        }
        await renderShell()

        expect(screen.getByRole("button", { name: "Open account menu" })).toBeInTheDocument()
        expect(screen.getByText("Alex")).toBeInTheDocument()
        expect(screen.queryByRole("status", { name: "Loading account" })).toBeNull()
    })
})
