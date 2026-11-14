import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { createAuthSnapshot } from "@api/auth.session"
import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: false,
            isLoading: false,
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

const NOW = 1_700_000_000_000
const token = "guest-token"

async function renderInviteAsGuest() {
    const seeds = new Map<string, unknown>([
        [
            seedKey("invites:get", { token, now: NOW }),
            {
                target: { kind: "group" },
                createdByName: "Sam",
                groupName: "Taco Crew",
                expiresAt: NOW + 1_000_000,
            },
        ],
    ])
    const backend = createSeededClient({ seeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [`/invite/${token}`] }),
        context: { queryClient: backend.queryClient, authSnapshot: createAuthSnapshot() },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client} auth="unauthenticated">
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    return router
}

describe("invite sign-in prompt", () => {
    beforeEach(() => {
        vi.spyOn(Date, "now").mockReturnValue(NOW)
        localStorage.clear()
    })

    test("shows the group invite and routes sign in through login", async () => {
        const router = await renderInviteAsGuest()
        const user = userEvent.setup()

        expect(await screen.findByText("Taco Crew invited you")).toBeInTheDocument()
        await user.click(screen.getByRole("button", { name: "Sign in to join" }))
        await expect.poll(() => router.state.location.pathname).toBe("/login")
    })
})
