import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex-client"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded-client"

import { routeTree } from "../routeTree.gen"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

vi.mock("@api/auth-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth-client")>()
    return {
        ...original,
        getConvexSessionToken: vi.fn<() => Promise<string | null>>(async () => {
            await Promise.resolve()
            return "test-token"
        }),
    }
})

vi.mock("@api/auth-provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth-provider")>()
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
            signInWithSocial: noop,
            requestOtp: noop,
            verifyOtp: noop,
            signOut: noop,
        }),
    }
})

function seedQuery(fn: string, args: unknown, value: unknown): void {
    querySeeds.set(seedKey(fn, args), value)
}

function sharedRestaurant(overrides?: Partial<Omit<RestaurantDoc, "_id">> & { _id?: string }): RestaurantDoc {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the restaurant document
    return {
        _id: "r1",
        _creationTime: 1000,
        ownerId: "ben",
        ownerName: "Ben",
        name: "Ben's Bistro",
        cuisine: "French",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "shared",
        createdAt: 1000,
        ...overrides,
    } as unknown as RestaurantDoc
}

function seedFriends(): void {
    seedQuery("friendships:listFriends", undefined, [{ authUserId: "ben", name: "Ben" }])
    seedQuery("friendships:listFriendRequests", undefined, {
        incoming: [{ authUserId: "cas", name: "Cas" }],
        outgoing: [{ authUserId: "dan", name: "Dan" }],
    })
    seedQuery("friendships:listDiscoveries", { friendAuthUserId: "ben" }, [sharedRestaurant()])
    seedQuery("restaurants:feed", undefined, [])
    seedQuery("restaurants:get", undefined, [])
}

async function renderAt(path: string): Promise<void> {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "f9" })
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

describe("friends screen", () => {
    test("renders friends with their recent discoveries", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedFriends()
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByText("Ben")).toBeInTheDocument()
        })
        await waitFor(() => {
            expect(screen.getByText("Ben's Bistro")).toBeInTheDocument()
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
            expect(mutationCalls).toContainEqual({ fn: "friendships:acceptFriend", args: { friendAuthUserId: "cas" } })
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
            expect(mutationCalls).toContainEqual({ fn: "friendships:removeFriend", args: { friendAuthUserId: "ben" } })
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
                fn: "friendships:requestFriendByEmail",
                args: { email: "eve@example.com" },
            })
        })
    })

    test("shows an empty state with no friends", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("friendships:listFriends", undefined, [])
        seedQuery("friendships:listFriendRequests", undefined, { incoming: [], outgoing: [] })
        seedQuery("restaurants:feed", undefined, [])
        seedQuery("restaurants:get", undefined, [])
        await renderAt("/friends")

        await waitFor(() => {
            expect(screen.getByText("No friends yet")).toBeInTheDocument()
        })
    })
})
