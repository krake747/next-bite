import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"

vi.mock("@api/auth.sdk", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.sdk")>()
    return {
        ...original,
        getConvexSessionToken: vi.fn<() => Promise<string | null>>(async () => {
            await Promise.resolve()
            return "test-token"
        }),
    }
})

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = null

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuth: () => ({
            isAuthenticated: testUser !== null,
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

async function renderAt(path: string): Promise<void> {
    // The signed-out home reads the landing aggregate; unseeded queries fall back to an empty
    // list, which is not the aggregate shape, so seed it explicitly.
    const seeds = new Map<string, unknown>([
        [
            seedKey("landing:getStats", undefined),
            { totalRestaurants: 0, totalWants: 0, topCuisines: [], recentAdds: [] },
        ],
    ])
    const backend = createSeededClient({ seeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[data-slot="page-layout"]')).toBeInTheDocument()
    })
}

function signIn(): void {
    testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
}

afterEach(() => {
    testUser = null
})

describe("app shell", () => {
    test("shows five destinations with working links", async () => {
        signIn()
        await renderAt("/")

        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/")
        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("href", "/friends")
        expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Groups" })).toHaveAttribute("href", "/groups")
        expect(screen.getByRole("link", { name: "You" })).toHaveAttribute("href", "/you")
    })

    test("hides the nav for signed-out visitors", async () => {
        await renderAt("/")

        expect(document.querySelector('[data-slot="app-nav"]')).not.toBeInTheDocument()
        const signInLinks = screen.getAllByRole("link", { name: "Sign In" })
        expect(signInLinks.length).toBeGreaterThan(0)
        for (const link of signInLinks) {
            expect(link).toHaveAttribute("href", "/login")
        }
    })

    test("marks the current destination", async () => {
        signIn()
        await renderAt("/friends")

        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("aria-current", "page")
        expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
    })

    test("navigates between destinations", async () => {
        signIn()
        await renderAt("/")

        // Same happy-dom reason as the dialog test below: userEvent stalls on this
        // navigation, fireEvent drives the same Link deterministically.
        fireEvent.click(screen.getByRole("link", { name: "Groups" }))

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Groups" })).toBeInTheDocument()
        })
    })

    test("opens the add flow from the Add destination", async () => {
        signIn()
        await renderAt("/")

        // userEvent hangs with the dialog focus trap under happy-dom; fireEvent is deterministic here.
        fireEvent.click(screen.getByRole("button", { name: "Add" }))

        await waitFor(
            () => {
                expect(screen.getByRole("heading", { name: "Add Restaurant" })).toBeInTheDocument()
            },
            { timeout: 5000 },
        )
    })
})
