import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { authClient } from "@core/auth-client"

import { routeTree } from "../../routeTree.gen"

vi.mock("@core/auth-client", () => ({
    authClient: {
        useSession: () => ({
            data: null,
            isPending: false,
        }),
        getSession: vi.fn<
            () => Promise<{ data: { user: { id: string; email: string; name: string } | null }; error: null }>
        >(async () => {
            await Promise.resolve()
            return { data: { user: null }, error: null }
        }),
        convex: {
            token: vi.fn<() => Promise<{ data: null }>>(async () => {
                await Promise.resolve()
                return { data: null }
            }),
        },
    },
}))

async function renderAt(path: string): Promise<void> {
    const queryClient = new QueryClient()
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient },
    })
    await router.load()
    render(<RouterProvider router={router} />)
    await waitFor(() => {
        expect(document.querySelector('[data-slot="app-nav"]')).toBeInTheDocument()
    })
}

const signedInUser = { id: "user-1", email: "alex@example.com", name: "Alex" }

function signIn(): void {
    vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: signedInUser }, error: null })
}

afterEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: null }, error: null })
})

describe("app shell", () => {
    it("shows five destinations with working links", async () => {
        signIn()
        await renderAt("/")

        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/")
        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("href", "/friends")
        expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Groups" })).toHaveAttribute("href", "/groups")
        expect(screen.getByRole("link", { name: "You" })).toHaveAttribute("href", "/you")
    })

    it("sends signed-out visitors to login from Add", async () => {
        const user = userEvent.setup()
        await renderAt("/")

        await user.click(screen.getByRole("link", { name: "Add" }))

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
        })
    })

    it("marks the current destination", async () => {
        await renderAt("/friends")

        expect(screen.getByRole("link", { name: "Friends" })).toHaveAttribute("aria-current", "page")
        expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
    })

    it("navigates between destinations", async () => {
        const user = userEvent.setup()
        await renderAt("/")

        await user.click(screen.getByRole("link", { name: "Groups" }))

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Groups" })).toBeInTheDocument()
        })
    })

    it("renders the Friends stub page", async () => {
        await renderAt("/friends")
        expect(screen.getByRole("heading", { name: "Friends" })).toBeInTheDocument()
    })

    it("renders the Groups stub page", async () => {
        await renderAt("/groups")
        expect(screen.getByRole("heading", { name: "Groups" })).toBeInTheDocument()
    })

    it("renders the You stub page", async () => {
        await renderAt("/you")
        expect(screen.getByRole("heading", { name: "You" })).toBeInTheDocument()
    })

    it("opens the add flow from the Add destination", async () => {
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
