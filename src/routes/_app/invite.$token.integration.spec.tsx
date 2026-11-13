import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"

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

const acceptMock = vi.fn<(args: { token: string }) => Promise<unknown>>()
const acceptApi = { mutateAsync: acceptMock }

vi.mock("@core/groups", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/groups")>()
    return {
        ...original,
        useAcceptInvite: () => acceptApi,
    }
})

const NOW = 1_700_000_000_000

function groupPreview() {
    return {
        target: { kind: "group" },
        createdByName: "Sam",
        groupName: "Taco Crew",
        expiresAt: NOW + 1_000_000,
    }
}

function friendPreview() {
    return {
        target: { kind: "friend" },
        createdByName: "Sam",
        expiresAt: NOW + 1_000_000,
    }
}

async function renderInvite(token: string, preview: unknown) {
    const seeds = new Map<string, unknown>([[seedKey("invites:get", { token, now: NOW }), preview]])
    const backend = createSeededClient({ seeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [`/invite/${token}`] }),
        context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(alex) },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client} auth="authenticated">
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    return router
}

describe("invite accept", () => {
    beforeEach(() => {
        vi.spyOn(Date, "now").mockReturnValue(NOW)
        acceptMock.mockReset()
        localStorage.clear()
    })

    test("accepts a friend invite and lands on friends", async () => {
        acceptMock.mockResolvedValue({ result: "accepted", friendId: "p9" })
        const router = await renderInvite("token-friend", friendPreview())

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/friends")
        })
        expect(acceptMock).toHaveBeenCalledWith({ token: "token-friend" })
        expect(screen.queryByText("Ask for a group link instead.")).toBeNull()
    })

    test("a failed accept offers a retry that lands on the group", async () => {
        acceptMock.mockRejectedValue(new Error("offline"))
        const router = await renderInvite("token-group", groupPreview())

        const retry = await screen.findByRole("button", { name: "Try again" })
        expect(router.state.location.pathname).toBe("/invite/token-group")

        acceptMock.mockResolvedValue({ result: "accepted", groupId: "g1" })
        fireEvent.click(retry)
        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/groups/g1")
        })
        expect(acceptMock).toHaveBeenCalledWith({ token: "token-group" })
    })
})
