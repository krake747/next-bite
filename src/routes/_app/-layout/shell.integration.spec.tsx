import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../../routeTree.gen"
import { authSnapshotFor } from "../../../vitest.auth"
import { renderDocument } from "../../../vitest.render"

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
        useAuthContext: () => ({
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

async function renderAt(path: string, extraSeeds?: ReadonlyMap<string, unknown>): Promise<void> {
    const seeds = new Map<string, unknown>(extraSeeds ?? [])
    const backend = createSeededClient({ seeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(testUser) },
    })
    await router.load()
    renderDocument(
        <ConvexProvider client={backend.client} auth="authenticated">
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
        await renderAt("/home")

        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home")
        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("href", "/friends")
        expect(screen.getByRole("link", { name: "Add" })).toHaveAttribute("href", "/add")
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

    test("redirects signed-in visitors from the landing root to home", async () => {
        signIn()
        await renderAt("/")

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home")
        })
    })

    test("keeps the signed-in shell mounted across navigation", async () => {
        signIn()
        await renderAt("/home")
        const homeLink = screen.getByRole("link", { name: "Home" })
        const shell = document.querySelector('[data-slot="app-shell"]')
        expect(shell).toBeInTheDocument()

        for (const destination of ["Friends", "Groups", "You", "Home"]) {
            fireEvent.click(screen.getByRole("link", { name: destination }))
            await waitFor(() => {
                expect(screen.getByRole("link", { name: destination })).toHaveAttribute("aria-current", "page")
            })
            expect(screen.getByRole("link", { name: "Home" })).toBe(homeLink)
            expect(document.querySelector('[data-slot="app-shell"]')).toBe(shell)
        }
    })

    test("an invite preview shows public chrome to signed-out visitors", async () => {
        await renderAt("/invite/token-1")

        expect(document.querySelector('[data-slot="top-bar"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="app-shell"]')).not.toBeInTheDocument()
    })

    test("an invite shows the signed-in shell to members", async () => {
        signIn()
        await renderAt("/invite/token-1")

        expect(document.querySelector('[data-slot="app-shell"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="top-bar"]')).not.toBeInTheDocument()
    })

    test("marks the current destination", async () => {
        signIn()
        await renderAt("/friends")

        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("aria-current", "page")
        expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
    })

    test("navigates between destinations", async () => {
        signIn()
        await renderAt("/home")

        fireEvent.click(screen.getByRole("link", { name: "Groups" }))

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Groups" })).toBeInTheDocument()
        })
    })

    test("shows the profile name in the user card when it differs from the session", async () => {
        signIn()
        await renderAt(
            "/home",
            new Map([
                [
                    seedKey("identity:me", undefined),
                    {
                        status: "ready",
                        profile: {
                            _id: "p1",
                            authUserId: "user-1",
                            name: "Alexander",
                            email: "alex@example.com",
                        },
                    },
                ],
            ]),
        )

        await waitFor(() => {
            expect(screen.getByText("Alexander")).toBeInTheDocument()
        })
    })

    test("opens the add flow from the Add destination", async () => {
        signIn()
        await renderAt("/home")

        fireEvent.click(screen.getByRole("link", { name: "Add" }))

        await waitFor(
            () => {
                expect(screen.getByRole("heading", { name: "Add a restaurant" })).toBeInTheDocument()
            },
            { timeout: 5000 },
        )
    })
})
