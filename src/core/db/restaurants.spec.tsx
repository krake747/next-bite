import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { ConvexClient } from "convex/browser"
import { describe, expect, it, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"

import { authClient } from "../auth-client"
import { AuthProvider, useAuth as useProbeAuth } from "../auth-provider"
import { useRestaurants } from "../hooks"
import { mockBackend } from "./mock-sync-client"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    clearUserScopedQueries,
    getSessionCollections,
    resolveRestaurantIdByKey,
    toAddArgs,
    toUpdateArgs,
    type RestaurantAddArgs,
    type RestaurantDoc,
} from "./restaurants"

const SESSION = "user-1"

let injectedClient: ConvexClient | null = null

vi.mock("../convex-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("../convex-client")>()
    return { ...original, useConvexClient: () => injectedClient }
})

function injectSyncClient(syncClient: unknown): void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
    injectedClient = syncClient as ConvexClient
}

const { tokenMock } = vi.hoisted(() => ({
    tokenMock: vi.fn<() => Promise<{ data: { token: string } | null }>>(async () => {
        await Promise.resolve()
        return { data: { token: "test-token" } }
    }),
}))

vi.mock("../auth-client", () => ({
    authClient: {
        useSession: () => ({
            data: null,
            isPending: false,
        }),
        getSession: vi.fn<
            () => Promise<{ data: { user: { id: string; email: string; name: string } | null }; error: null }>
        >(async () => {
            await Promise.resolve()
            return { data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } }, error: null }
        }),
        convex: {
            token: tokenMock,
        },
    },
    getConvexSessionToken: async () => {
        const { data } = await tokenMock()
        return typeof data?.token === "string" ? data.token : null
    },
}))

function restaurantFixture(overrides?: Partial<RestaurantDoc>): RestaurantDoc {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the restaurant document
    return {
        _id: "r1",
        _creationTime: 1000,
        ownerId: "user-1",
        ownerName: "Alex",
        name: "Trattoria Verde",
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "private",
        createdAt: 1000,
        ...overrides,
    } as unknown as RestaurantDoc
}

function flakyAuthQuery(failures: number): { attempts: () => number; query: () => Promise<unknown> } {
    let attempts = 0
    return {
        attempts: () => attempts,
        query: async () => {
            attempts += 1
            if (attempts <= failures) {
                throw new Error("Unauthorized")
            }
            await Promise.resolve()
            return []
        },
    }
}
function mockPersist() {
    return {
        updateRestaurant: vi.fn<(args: { id: Id<"restaurants">; name?: string | undefined }) => Promise<unknown>>(
            async () => {
                await Promise.resolve()
            },
        ),
        addRestaurant: vi.fn<(args: RestaurantAddArgs) => Promise<Id<"restaurants">>>(async () => {
            await Promise.resolve()
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
            return "r9" as unknown as Id<"restaurants">
        }),
    }
}

describe("restaurant shape translators", () => {
    it("maps an update to the matching document fields", () => {
        const draft = restaurantFixture()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const id = "r1" as unknown as Id<"restaurants">

        applyUpdateArgsToDraft(draft, { id, name: "Sushi Bar", rating: 5 })

        expect(draft.name).toBe("Sushi Bar")
        expect(draft.rating).toBe(5)
        expect(draft.cuisine).toBe("Italian")
    })

    it("maps a full row back to update args", () => {
        const row = restaurantFixture({ name: "Sushi Bar" })

        expect(toUpdateArgs(row)).toMatchObject({ name: "Sushi Bar", cuisine: "Italian" })
    })

    it("maps a row to add args", () => {
        const row = restaurantFixture()

        expect(toAddArgs(row)).toMatchObject({
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
        })
    })

    it("forwards the client mutation key to add args", () => {
        const row = restaurantFixture({ clientMutationId: "user-1:key-1" })

        expect(toAddArgs(row)).toMatchObject({ clientMutationId: "user-1:key-1" })
    })

    it("builds temp rows carrying the client mutation key", () => {
        const temp = buildTempRestaurant({
            ownerId: "user-1",
            ownerName: "Alex",
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: "user-1:key-1",
        })

        expect(temp.clientMutationId).toBe("user-1:key-1")
        expect(() => {
            assertRealRestaurantId(temp._id)
        }).toThrow("still syncing")
    })

    it("accepts real ids in the temp guard", () => {
        expect(() => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
            assertRealRestaurantId("r1" as unknown as Id<"restaurants">)
        }).not.toThrow()
    })
})

describe("restaurant collections", () => {
    it("shows an optimistic update immediately and converges on sync", async () => {
        const persist = mockPersist()
        const backend = mockBackend([restaurantFixture()])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const id = "r1" as unknown as Id<"restaurants">

        const tx = collections.owner.update(id, (draft) => {
            draft.name = "Sushi Bar"
        })
        expect(collections.owner.get(id)?.name).toBe("Sushi Bar")
        await tx.when("settled")

        expect(tx.state).toBe("completed")
        expect(persist.updateRestaurant).toHaveBeenCalledWith(expect.objectContaining({ id: "r1", name: "Sushi Bar" }))
        backend.pushState([{ ...restaurantFixture(), name: "Sushi Bar" }])
        expect(collections.owner.get(id)?.name).toBe("Sushi Bar")
    })

    it("rolls back an optimistic update when persistence fails", async () => {
        const persist = mockPersist()
        persist.updateRestaurant.mockRejectedValueOnce(new Error("mutation failed"))
        const backend = mockBackend([restaurantFixture()])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const id = "r1" as unknown as Id<"restaurants">

        const tx = collections.owner.update(id, (draft) => {
            draft.name = "Sushi Bar"
        })
        expect(collections.owner.get(id)?.name).toBe("Sushi Bar")
        await tx.when("settled").catch(() => {})

        expect(tx.state).toBe("failed")
        expect(collections.owner.get(id)?.name).toBe("Trattoria Verde")
    })

    it("shows an optimistic insert immediately and swaps in the synced row", async () => {
        const persist = mockPersist()
        const backend = mockBackend([])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()

        const tx = collections.owner.insert({ ...restaurantFixture() })
        expect(collections.owner.size).toBe(1)
        await tx.when("settled")

        expect(tx.state).toBe("completed")
        expect(persist.addRestaurant).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Trattoria Verde", addressLabel: "Luxembourg City" }),
        )
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const realId = "r9" as unknown as Id<"restaurants">
        backend.pushState([{ ...restaurantFixture(), _id: realId }])
        expect(collections.owner.get(realId)?.name).toBe("Trattoria Verde")
        expect(collections.owner.size).toBe(1)
    })

    it("resolves the synced id by client mutation key after a delayed ack", async () => {
        const persist = mockPersist()
        const backend = mockBackend([])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()

        const temp = buildTempRestaurant({
            ownerId: "user-1",
            ownerName: "Alex",
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: "user-1:delayed",
        })
        const tx = collections.owner.insert(temp)
        await tx.when("settled")
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const realId = "r9" as unknown as Id<"restaurants">

        const pending = resolveRestaurantIdByKey(collections.owner, "user-1:delayed", 5000)
        backend.pushState([{ ...restaurantFixture(), _id: realId, clientMutationId: "user-1:delayed" }])

        await expect(pending).resolves.toBe(realId)
    })

    it("times out resolving an id that never syncs", async () => {
        const persist = mockPersist()
        const backend = mockBackend([])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()

        await expect(resolveRestaurantIdByKey(collections.owner, "user-1:ghost", 50)).rejects.toThrow("Timed out")
    })

    it("persists rapid consecutive inserts under distinct keys", async () => {
        const persist = mockPersist()
        const backend = mockBackend([])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()

        const first = collections.owner.insert(
            buildTempRestaurant({
                ownerId: "user-1",
                ownerName: "Alex",
                name: "First",
                cuisine: "Italian",
                addressLabel: "Luxembourg City",
                clientMutationId: "user-1:rapid-1",
            }),
        )
        const second = collections.owner.insert(
            buildTempRestaurant({
                ownerId: "user-1",
                ownerName: "Alex",
                name: "Second",
                cuisine: "Japanese",
                addressLabel: "Luxembourg City",
                clientMutationId: "user-1:rapid-2",
            }),
        )
        await first.when("settled")
        await second.when("settled")

        expect(persist.addRestaurant).toHaveBeenCalledTimes(2)
        const keys = persist.addRestaurant.mock.calls.map((call) => call[0]?.clientMutationId)
        expect(keys).toEqual(["user-1:rapid-1", "user-1:rapid-2"])
    })

    it("scopes synced rows per session key", async () => {
        const persist = mockPersist()
        const backend = mockBackend([restaurantFixture()])

        const anna = getSessionCollections(backend.syncClient, persist, "anna")
        await anna.owner.preload()
        expect(anna.owner.size).toBe(1)

        const ben = getSessionCollections(backend.syncClient, persist, "ben")
        expect(ben.owner).not.toBe(anna.owner)
        expect(ben.owner.size).toBe(0)
        await ben.owner.preload()
        expect(ben.owner.size).toBe(1)

        const annaAgain = getSessionCollections(backend.syncClient, persist, "anna")
        expect(annaAgain.owner.size).toBe(0)
    })

    it("rolls back an optimistic insert when persistence fails", async () => {
        const persist = mockPersist()
        persist.addRestaurant.mockRejectedValueOnce(new Error("mutation failed"))
        const backend = mockBackend([])
        const collections = getSessionCollections(backend.syncClient, persist, SESSION)
        await collections.owner.preload()

        const tx = collections.owner.insert(
            buildTempRestaurant({
                ownerId: "user-1",
                ownerName: "Alex",
                name: "Trattoria Verde",
                cuisine: "Italian",
                addressLabel: "Luxembourg City",
                clientMutationId: "user-1:doomed",
            }),
        )
        expect(collections.owner.size).toBe(1)
        await tx.when("settled").catch(() => {})

        expect(tx.state).toBe("failed")
        expect(collections.owner.size).toBe(0)
    })

    it("clears user-scoped queries while keeping shared ones", () => {
        const queryClient = new QueryClient()
        queryClient.setQueryData(["restaurants:get", "{}"], [{ name: "Stale" }])
        queryClient.setQueryData(["friendships:listFriends", "{}"], [])
        queryClient.setQueryData(["social:getSummaries", "{}"], [])
        queryClient.setQueryData(["users:getMe", "{}"], { status: "onboarding" })
        queryClient.setQueryData(["groups:listMyGroups", "{}"], [])
        queryClient.setQueryData(["landing:getStats", "{}"], { count: 1 })
        queryClient.setQueryData(["auth:getAuthMethods", "{}"], { password: true })

        clearUserScopedQueries((filters) => {
            queryClient.removeQueries(filters)
        })

        expect(queryClient.getQueryData(["restaurants:get", "{}"])).toBeUndefined()
        expect(queryClient.getQueryData(["friendships:listFriends", "{}"])).toBeUndefined()
        expect(queryClient.getQueryData(["social:getSummaries", "{}"])).toBeUndefined()
        expect(queryClient.getQueryData(["users:getMe", "{}"])).toBeUndefined()
        expect(queryClient.getQueryData(["groups:listMyGroups", "{}"])).toBeUndefined()
        expect(queryClient.getQueryData(["landing:getStats", "{}"])).toEqual({ count: 1 })
        expect(queryClient.getQueryData(["auth:getAuthMethods", "{}"])).toEqual({ password: true })
    })

    it("returns collection rows from the restaurants hook", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)
        const queryClient = new QueryClient()

        const { result } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })

        await vi.waitFor(() => {
            expect(result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        })
    })

    it("returns undefined from the restaurants hook when signed out", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: null }, error: null })
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)
        const queryClient = new QueryClient()

        const { result } = renderHook(
            () => {
                const auth = useProbeAuth()
                return { restaurants: useRestaurants(), authed: auth.isAuthenticated }
            },
            {
                wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>{children}</AuthProvider>
                    </QueryClientProvider>
                ),
            },
        )

        await vi.waitFor(() => {
            expect(vi.mocked(authClient.getSession)).toHaveBeenCalled()
        })
        await new Promise((resolve) => {
            setTimeout(resolve, 50)
        })
        expect(result.current.authed).toBe(false)
        expect(result.current.restaurants).toBeUndefined()
        expect(backend.subscriberCount()).toBe(0)
    })

    it("isolates account data across sign-out to a different account", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "anna", email: "anna@example.com", name: "Anna" } },
            error: null,
        })
        const annasBackend = mockBackend([restaurantFixture({ ownerId: "anna", ownerName: "Anna" })])
        injectSyncClient(annasBackend.syncClient)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const first = renderHook(() => useRestaurants(), { wrapper })
        await vi.waitFor(() => {
            expect(first.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        })
        first.unmount()

        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "ben", email: "ben@example.com", name: "Ben" } },
            error: null,
        })
        const bensBackend = mockBackend([restaurantFixture({ ownerId: "ben", ownerName: "Ben", name: "Sushi Bar" })])
        injectSyncClient(bensBackend.syncClient)

        const second = renderHook(() => useRestaurants(), { wrapper })
        await vi.waitFor(() => {
            expect(second.result.current?.map((r) => r.name)).toEqual(["Sushi Bar"])
        })
        expect(second.result.current?.some((r) => r.ownerId === "anna")).toBe(false)
    })

    it("waits for the convex token before subscribing", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        tokenMock.mockResolvedValue({ data: null })
        const gated = mockBackend([restaurantFixture()])
        injectSyncClient(gated.syncClient)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const { result, unmount } = renderHook(() => useRestaurants(), { wrapper })
        await vi.waitFor(() => {
            expect(vi.mocked(authClient.getSession)).toHaveBeenCalled()
        })
        // Session resolved but no convex token: no subscription, no rows.
        await new Promise((resolve) => {
            setTimeout(resolve, 50)
        })
        expect(result.current).toBeUndefined()
        expect(gated.subscriberCount()).toBe(0)
        unmount()

        tokenMock.mockResolvedValue({ data: { token: "test-token" } })
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)

        const second = renderHook(() => useRestaurants(), { wrapper })
        await vi.waitFor(() => {
            expect(second.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        })
        expect(backend.subscriberCount()).toBeGreaterThan(0)
    })

    it("holds subscriptions until convex auth installs", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        const flaky = flakyAuthQuery(2)
        const backend = mockBackend([], { query: flaky.query })
        injectSyncClient(backend.syncClient)
        const queryClient = new QueryClient()

        const { result } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })

        expect(backend.subscriberCount()).toBe(0)
        await vi.waitFor(
            () => {
                expect(result.current).toEqual([])
            },
            { timeout: 8000 },
        )
        expect(flaky.attempts()).toBeGreaterThanOrEqual(3)
        expect(backend.subscriberCount()).toBeGreaterThan(0)
    })

    it("resets user-scoped query data when the session changes", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)
        const queryClient = new QueryClient()

        const { unmount } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })
        await vi.waitFor(() => {
            expect(queryClient.getQueryData(["social:getSummaries", "{}"])).toBeUndefined()
        })
        queryClient.setQueryData(["restaurants:get", "{}"], [{ name: "Stale" }])
        queryClient.setQueryData(["users:getMe", "{}"], { status: "onboarding" })
        queryClient.setQueryData(["landing:getStats", "{}"], { count: 1 })
        unmount()
        vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: null }, error: null })

        renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })
        await vi.waitFor(() => {
            expect(queryClient.getQueryData(["restaurants:get", "{}"])).toBeUndefined()
        })
        expect(queryClient.getQueryData(["landing:getStats", "{}"])).toEqual({ count: 1 })
    })
})
