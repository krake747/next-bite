import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"
import { renderDocument } from "../../vitest.render"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

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

function seedQuery(fn: string, args: unknown, value: unknown): void {
    querySeeds.set(seedKey(fn, args), value)
}

function seedFriends(): void {
    seedQuery("social:friends", undefined, [{ profileId: "ben", name: "Ben" }])
    seedQuery("social:requests", undefined, {
        incoming: [{ profileId: "cas", name: "Cas" }],
        outgoing: [{ profileId: "dan", name: "Dan" }],
    })
    seedQuery("places:feed", undefined, [])
    seedQuery("places:mine", undefined, [])
}

async function renderAt(path: string): Promise<void> {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "f9" })
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

describe("friends screen", () => {
    test("renders friends", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByText("Ben")).toBeInTheDocument()
        })
    })

    test("renders incoming and outgoing requests", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByText("Cas")).toBeInTheDocument()
        })
        expect(screen.getByText("Wants to be friends")).toBeInTheDocument()
        expect(screen.getByText("Dan")).toBeInTheDocument()
        expect(screen.getByText("Request sent")).toBeInTheDocument()
    })

    test("accepts an incoming request", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        mutationCalls.length = 0
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Accept" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "social:accept", args: { friendId: "cas" } })
        })
    })

    test("removes a friend", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        mutationCalls.length = 0
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Remove" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "social:remove", args: { friendId: "ben" } })
        })
    })

    test("invites a friend by email", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        mutationCalls.length = 0
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByLabelText("Invite by email")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("Invite by email"), { target: { value: "eve@example.com" } })
        fireEvent.click(screen.getByRole("button", { name: "Send request" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "social:requestByEmail",
                args: { email: "eve@example.com" },
            })
        })
    })

    test("shows an empty state with no friends", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("social:friends", undefined, [])
        seedQuery("social:requests", undefined, { incoming: [], outgoing: [] })
        seedQuery("places:feed", undefined, [])
        seedQuery("places:mine", undefined, [])
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByText("No friends yet")).toBeInTheDocument()
        })
    })
})
