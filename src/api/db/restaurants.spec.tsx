import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { type ConvexReactClient } from "convex/react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { CollectionSyncError, useRestaurants } from "@core/restaurants"
import { useAuth as useProbeAuth } from "@core/session"

import { CatchError } from "../../vitest.catch"
import { AuthProvider } from "../auth.provider"
import { authClient } from "../auth.sdk"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    clearUserScopedQueries,
    dropSessionCollections,
    getSessionCollections,
    resolveRestaurantIdByKey,
    SyncTimeoutError,
    toAddArgs,
    toUpdateArgs,
    type RestaurantAddArgs,
    type RestaurantDoc,
} from "./restaurants"
import { createSeededClient } from "./seeded.client"

const SESSION = "user-1"

let injectedClient: ConvexReactClient | null = null

vi.mock("@api/convex.context", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/convex.context")>()
    return { ...original, useConvexClient: () => injectedClient }
})

const { providerClients } = vi.hoisted(() => ({
    providerClients: [] as { reportAuth: ((isAuthenticated: boolean) => void) | null }[],
}))

// Hooks under test read the injected seeded client, so the provider-owned client never
// serves data. Stub it to a non-connecting shape: the real client dials the test URL and
// its async connection fatals escape as unhandled errors that fail the suite.
vi.mock("convex/react", async (importOriginal) => {
    const original = await importOriginal<typeof import("convex/react")>()
    return {
        ...original,
        ConvexReactClient: class {
            setAuthCalls: unknown[] = []
            clearedAuthCalls = 0
            watchCalls: unknown[][] = []
            constructor() {
                providerClients.push(this)
            }
            setAuth(
                fetchToken: (options: { forceRefreshToken: boolean }) => Promise<string | null>,
                onChange: (isAuthenticated: boolean) => void,
            ): void {
                this.setAuthCalls.push(fetchToken)
                this.reportAuth = onChange
                void fetchToken({ forceRefreshToken: false }).then((token) => {
                    onChange(token !== null)
                })
            }
            reportAuth: ((isAuthenticated: boolean) => void) | null = null
            clearAuth(): void {
                this.clearedAuthCalls += 1
            }
            watchQuery(...args: unknown[]): {
                localQueryResult: () => unknown
                onUpdate: (receive: (value: never) => void) => () => void
            } {
                this.watchCalls.push(args)
                // The provider-owned client never serves data; the adapter only needs the
                // subscription shape to exist when specs seed convex namespaced cache entries.
                return {
                    localQueryResult: (): null => null,
                    onUpdate: () => (): void => {},
                }
            }
        },
    }
})

function injectSyncClient(syncClient: unknown): void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
    injectedClient = syncClient as ConvexReactClient
}

const { tokenMock } = vi.hoisted(() => ({
    tokenMock: vi.fn<() => Promise<{ data: { token: string } | null }>>(async () => {
        await Promise.resolve()
        return { data: { token: "test-token" } }
    }),
}))

vi.mock("../auth.sdk", () => ({
    authClient: {
        useSession: () => ({
            data: { session: { id: "session-1", token: "token-1" } },
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
        return data?.token ?? null
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
    test("maps an update to the matching document fields", () => {
        const draft = restaurantFixture()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
        const id = "r1" as unknown as Id<"restaurants">

        applyUpdateArgsToDraft(draft, { id, name: "Sushi Bar", rating: 5 })

        expect(draft.name).toBe("Sushi Bar")
        expect(draft.rating).toBe(5)
        expect(draft.cuisine).toBe("Italian")
    })

    test("maps a full row back to update args", () => {
        const row = restaurantFixture({ name: "Sushi Bar" })

        expect(toUpdateArgs(row)).toMatchObject({ name: "Sushi Bar", cuisine: "Italian" })
    })

    test("maps a row to add args", () => {
        const row = restaurantFixture()

        expect(toAddArgs(row)).toMatchObject({
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
        })
    })

    test("forwards the client mutation key to add args", () => {
        const row = restaurantFixture({ clientMutationId: "user-1:key-1" })

        expect(toAddArgs(row)).toMatchObject({ clientMutationId: "user-1:key-1" })
    })

    test("builds temp rows carrying the client mutation key", () => {
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

    test("accepts real ids in the temp guard", () => {
        expect(() => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
            assertRealRestaurantId("r1" as unknown as Id<"restaurants">)
        }).not.toThrow()
    })
})

describe("restaurant collections", () => {
    test("shows an optimistic update immediately and converges on sync", async () => {
        const persist = mockPersist()
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("rolls back an optimistic update when persistence fails", async () => {
        const persist = mockPersist()
        persist.updateRestaurant.mockRejectedValueOnce(new Error("mutation failed"))
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("shows an optimistic insert immediately and swaps in the synced row", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("resolves the synced id by client mutation key after a delayed ack", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("times out resolving an id that never syncs", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()

        await expect(resolveRestaurantIdByKey(collections.owner, "user-1:ghost", 50)).rejects.toThrow("Timed out")
    })

    test("timeout errors carry a retryable code", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()

        const error = await resolveRestaurantIdByKey(collections.owner, "user-1:ghost", 30).then(
            () => null,
            (failure: unknown) => failure,
        )
        expect(SyncTimeoutError.is(error)).toBe(true)
    })

    test("persists rapid consecutive inserts under distinct keys", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("scopes synced rows per session key", async () => {
        const persist = mockPersist()
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })

        const anna = getSessionCollections(backend.client, persist, "anna")
        await anna.owner.preload()
        expect(anna.owner.size).toBe(1)

        const ben = getSessionCollections(backend.client, persist, "ben")
        expect(ben.owner).not.toBe(anna.owner)
        expect(ben.owner.size).toBe(0)
        await ben.owner.preload()
        expect(ben.owner.size).toBe(1)

        const annaAgain = getSessionCollections(backend.client, persist, "anna")
        expect(annaAgain.owner.size).toBe(0)
    })

    test("rolls back an optimistic insert when persistence fails", async () => {
        const persist = mockPersist()
        persist.addRestaurant.mockRejectedValueOnce(new Error("mutation failed"))
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
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

    test("clears user-scoped queries while keeping shared ones", () => {
        const queryClient = new QueryClient()
        queryClient.setQueryData(["convexQuery", "restaurants:get", {}], [{ name: "Stale" }])
        queryClient.setQueryData(["convexQuery", "friendships:listFriends", {}], [])
        queryClient.setQueryData(["convexQuery", "social:getSummaries", {}], [])
        queryClient.setQueryData(["convexQuery", "users:getMe", {}], { status: "onboarding" })
        queryClient.setQueryData(["convexQuery", "groups:listMyGroups", {}], [])
        queryClient.setQueryData(["convexQuery", "landing:getStats", {}], { count: 1 })
        queryClient.setQueryData(["convexQuery", "auth:getAuthMethods", {}], { password: true })

        clearUserScopedQueries((filters) => {
            queryClient.removeQueries(filters)
        })

        expect(queryClient.getQueryData(["convexQuery", "restaurants:get", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "friendships:listFriends", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "social:getSummaries", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "users:getMe", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "groups:listMyGroups", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "landing:getStats", {}])).toEqual({ count: 1 })
        expect(queryClient.getQueryData(["convexQuery", "auth:getAuthMethods", {}])).toEqual({ password: true })
    })

    test("returns collection rows from the restaurants hook", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(backend.client)
        const queryClient = new QueryClient()

        const { result } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })

        await expect.poll(() => result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
    })

    test("returns undefined from the restaurants hook when signed out", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: null }, error: null })
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(backend.client)
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

        await expect.poll(() => vi.mocked(authClient.getSession)).toHaveBeenCalled()
        await expect.poll(() => result.current.authed).toBe(false)
        expect(result.current.authed).toBe(false)
        expect(result.current.restaurants).toBeUndefined()
        expect(backend.subscriberCount()).toBe(0)
    })

    test("isolates user data across sign-out to a different user", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "anna", email: "anna@example.com", name: "Anna" } },
            error: null,
        })
        const annasBackend = createSeededClient({
            liveRows: [restaurantFixture({ ownerId: "anna", ownerName: "Anna" })],
        })
        injectSyncClient(annasBackend.client)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const first = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => first.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        first.unmount()

        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "ben", email: "ben@example.com", name: "Ben" } },
            error: null,
        })
        const bensBackend = createSeededClient({
            liveRows: [restaurantFixture({ ownerId: "ben", ownerName: "Ben", name: "Sushi Bar" })],
        })
        injectSyncClient(bensBackend.client)

        const second = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => second.result.current?.map((r) => r.name)).toEqual(["Sushi Bar"])
        expect(second.result.current?.some((r) => r.ownerId === "anna")).toBe(false)
    })

    test("waits for the convex token before subscribing", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        tokenMock.mockResolvedValue({ data: null })
        const gated = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(gated.client)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const { result, unmount } = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => vi.mocked(authClient.getSession)).toHaveBeenCalled()
        // Session resolved but no convex token: no subscription, no rows.
        await expect.poll(() => result.current).toBeUndefined()
        expect(result.current).toBeUndefined()
        expect(gated.subscriberCount()).toBe(0)
        unmount()

        tokenMock.mockResolvedValue({ data: { token: "test-token" } })
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(backend.client)

        const second = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => second.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        expect(backend.subscriberCount()).toBeGreaterThan(0)
    })

    test("holds subscriptions until convex auth installs", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        let releaseToken!: () => void
        const tokenReleased = new Promise<void>((resolve) => {
            releaseToken = resolve
        })
        tokenMock.mockImplementationOnce(async () => {
            await tokenReleased
            return { data: { token: "test-token" } }
        })
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(backend.client)
        const queryClient = new QueryClient()

        const { result } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>{children}</AuthProvider>
                </QueryClientProvider>
            ),
        })

        await expect.poll(() => vi.mocked(authClient.getSession)).toHaveBeenCalled()
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 100)
        })
        expect(result.current).toBeUndefined()
        expect(backend.subscriberCount()).toBe(0)

        releaseToken()

        await expect.poll(() => result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        expect(backend.subscriberCount()).toBeGreaterThan(0)
    })

    test("resets user-scoped query data when the session changes", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
            error: null,
        })
        const backend = createSeededClient({ liveRows: [restaurantFixture()] })
        injectSyncClient(backend.client)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const first = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => first.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        queryClient.setQueryData(["convexQuery", "restaurants:get", {}], [{ name: "Stale" }])
        queryClient.setQueryData(["convexQuery", "users:getMe", {}], { status: "onboarding" })
        queryClient.setQueryData(["convexQuery", "landing:getStats", {}], { count: 1 })
        first.unmount()
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "ben", email: "ben@example.com", name: "Ben" } },
            error: null,
        })

        renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => queryClient.getQueryData(["convexQuery", "restaurants:get", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "users:getMe", {}])).toBeUndefined()
        expect(queryClient.getQueryData(["convexQuery", "landing:getStats", {}])).toEqual({ count: 1 })
    })

    describe("collection recovery", () => {
        function renderOwnedRestaurants() {
            const queryClient = new QueryClient()
            return renderHook(() => useRestaurants(), {
                wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>{children}</AuthProvider>
                    </QueryClientProvider>
                ),
            })
        }

        test("recovers the session collection after a mid-session sync failure", async () => {
            vi.mocked(authClient.getSession).mockResolvedValue({
                data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
                error: null,
            })
            const backend = createSeededClient({ liveRows: [restaurantFixture()] })
            injectSyncClient(backend.client)

            const { result } = renderOwnedRestaurants()
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])

            backend.failSync()

            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])
            expect(backend.subscriberCount()).toBe(1)
        })

        test("stays gated without looping when auth cannot re-verify after a failure", async () => {
            vi.mocked(authClient.getSession).mockResolvedValue({
                data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
                error: null,
            })
            const backend = createSeededClient({ liveRows: [restaurantFixture()] })
            injectSyncClient(backend.client)

            const { result, unmount } = renderOwnedRestaurants()
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])

            act(() => {
                providerClients.at(-1)?.reportAuth?.(false)
                backend.failSync()
            })

            await expect.poll(() => result.current).toBeUndefined()
            const settledCount = backend.subscriberCount()
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 1000)
            })
            expect(backend.subscriberCount()).toBe(settledCount)
            expect(result.current).toBeUndefined()
            unmount()
        })

        test("a sync that keeps failing surfaces an error instead of an empty list", async () => {
            vi.mocked(authClient.getSession).mockResolvedValue({
                data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
                error: null,
            })
            const backend = createSeededClient({ liveRows: [] })
            backend.breakSync()
            injectSyncClient(backend.client)
            const seen: (ReadonlyArray<unknown> | undefined)[] = []
            let caught: unknown = null
            const queryClient = new QueryClient()
            renderHook(
                () => {
                    const rows = useRestaurants()
                    seen.push(rows)
                    return rows
                },
                {
                    wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                        <CatchError
                            onError={(error) => {
                                caught = error
                            }}
                        >
                            <QueryClientProvider client={queryClient}>
                                <AuthProvider>{children}</AuthProvider>
                            </QueryClientProvider>
                        </CatchError>
                    ),
                },
            )

            await expect.poll(() => caught).toBeInstanceOf(CollectionSyncError)
            expect(seen.some((rows) => rows !== undefined)).toBe(false)
        })

        test("a failed refresh keeps rows that already loaded", async () => {
            vi.mocked(authClient.getSession).mockResolvedValue({
                data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
                error: null,
            })
            const backend = createSeededClient({ liveRows: [restaurantFixture()] })
            injectSyncClient(backend.client)
            const seen: (ReadonlyArray<string> | undefined)[] = []
            let caught: unknown = null
            const queryClient = new QueryClient()
            const { result } = renderHook(
                () => {
                    const rows = useRestaurants()
                    seen.push(rows?.map((item) => item.name))
                    return rows
                },
                {
                    wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                        <CatchError
                            onError={(error) => {
                                caught = error
                            }}
                        >
                            <QueryClientProvider client={queryClient}>
                                <AuthProvider>{children}</AuthProvider>
                            </QueryClientProvider>
                        </CatchError>
                    ),
                },
            )
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])
            const loadedAt = seen.length

            act(() => {
                backend.breakSync()
            })
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 300)
            })

            expect(seen.length).toBeGreaterThan(loadedAt)
            expect(seen.slice(loadedAt).every((names) => names?.join() === "Trattoria Verde")).toBe(true)
            expect(caught).toBeNull()
        })

        test("dropSessionCollections only evicts the matching session", () => {
            const backend = createSeededClient({ liveRows: [restaurantFixture()] })
            const persist = mockPersist()
            const first = getSessionCollections(backend.client, persist, "drop-a")

            expect(dropSessionCollections(backend.client, "drop-b")).toBe(false)
            expect(getSessionCollections(backend.client, persist, "drop-a")).toBe(first)
            expect(dropSessionCollections(backend.client, "drop-a")).toBe(true)
            expect(getSessionCollections(backend.client, persist, "drop-a")).not.toBe(first)
        })

        test("abandons uncommitted optimistic rows instead of duplicating them", async () => {
            vi.mocked(authClient.getSession).mockResolvedValue({
                data: { user: { id: "user-1", email: "alex@example.com", name: "Alex" } },
                error: null,
            })
            const backend = createSeededClient({ liveRows: [restaurantFixture()] })
            injectSyncClient(backend.client)
            const { result } = renderOwnedRestaurants()
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])

            // Insert a temp row into the hook's live collection, then fail the
            // sync underneath it while the mutation is still in flight.
            const draft = getSessionCollections(backend.client, mockPersist(), SESSION)
            const pending = draft.owner.insert(
                buildTempRestaurant({
                    ownerId: "user-1",
                    ownerName: "Alex",
                    name: "Sushi Bar",
                    cuisine: "Japanese",
                    addressLabel: "Luxembourg City",
                    clientMutationId: "user-1:k9",
                }),
            )
            backend.failSync()
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])

            await pending.when("settled").catch(() => {})
            await expect.poll(() => result.current?.map((item) => item.name)).toEqual(["Trattoria Verde"])
            expect(
                result.current?.every((row) => {
                    assertRealRestaurantId(row._id)
                    return true
                }),
            ).toBe(true)
        })
    })
})
