import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { type ConvexReactClient } from "convex/react"
import { describe, expect, test, vi } from "vitest"

import { toId } from "@api/data.model"
import { type Id } from "@convex/_generated/dataModel"
import { CollectionSyncError, useRestaurants } from "@core/restaurants"

import { CatchError } from "../../vitest.catch"
import { AuthProvider } from "../auth.provider"
import { authClient } from "../auth.sdk"
import {
    assertRealPlaceId,
    buildTempPlace,
    getSessionCollections,
    resolvePlaceIdByKey,
    toCreateArgs,
    type PlaceCreateArgs,
    type PlaceCard,
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
}))

function placeFixture(overrides?: Partial<PlaceCard>): PlaceCard {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the place card
    return {
        _id: "r1",
        _creationTime: 1000,
        ownerId: toId<"profiles">("user-1"),
        ownerName: "Alex",
        name: "Trattoria Verde",
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        photos: [],
        mySave: null,
        wantCount: 0,
        ...overrides,
    } as unknown as PlaceCard
}

function mockPersist() {
    return {
        addPlace: vi.fn<(args: PlaceCreateArgs) => Promise<Id<"places">>>(async () => {
            await Promise.resolve()
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only place id
            return "r9" as unknown as Id<"places">
        }),
    }
}

describe("place shape translators", () => {
    test("forwards the client mutation key to create args", () => {
        const row = placeFixture({ clientMutationId: "user-1:key-1" })

        expect(toCreateArgs(row)).toMatchObject({ clientMutationId: "user-1:key-1" })
    })

    test("builds temp rows carrying the client mutation key", () => {
        const temp = buildTempPlace({
            ownerId: toId<"profiles">("user-1"),
            ownerName: "Alex",
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            photos: [],
            previewUrls: new Map(),
            clientMutationId: "user-1:key-1",
        })

        expect(temp.clientMutationId).toBe("user-1:key-1")
        expect(() => {
            assertRealPlaceId(temp._id)
        }).toThrow("still syncing")
    })
})

describe("place collections", () => {
    test("rejects local updates because places are append-only", async () => {
        const persist = mockPersist()
        const backend = createSeededClient({ liveRows: [placeFixture()] })
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only place id
        const id = "r1" as unknown as Id<"places">

        const tx = collections.owner.update(id, (draft) => {
            draft.name = "Sushi Bar"
        })
        await tx.when("settled").catch(() => {})

        expect(tx.state).toBe("failed")
        expect(collections.owner.get(id)?.name).toBe("Trattoria Verde")
    })

    test("shows an optimistic insert immediately and swaps in the synced row", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()

        const tx = collections.owner.insert({ ...placeFixture() })
        expect(collections.owner.size).toBe(1)
        await tx.when("settled")

        expect(tx.state).toBe("completed")
        expect(persist.addPlace).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Trattoria Verde", addressLabel: "Luxembourg City" }),
        )
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only place id
        const realId = "r9" as unknown as Id<"places">
        backend.pushState([{ ...placeFixture(), _id: realId }])
        expect(collections.owner.get(realId)?.name).toBe("Trattoria Verde")
        expect(collections.owner.size).toBe(1)
    })

    test("resolves the synced id by client mutation key after a delayed ack", async () => {
        const persist = mockPersist()
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()

        const temp = buildTempPlace({
            ownerId: toId<"profiles">("user-1"),
            ownerName: "Alex",
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            photos: [],
            previewUrls: new Map(),
            clientMutationId: "user-1:delayed",
        })
        const tx = collections.owner.insert(temp)
        await tx.when("settled")
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only place id
        const realId = "r9" as unknown as Id<"places">

        const pending = resolvePlaceIdByKey(collections.owner, "user-1:delayed", 5000)
        backend.pushState([{ ...placeFixture(), _id: realId, clientMutationId: "user-1:delayed" }])

        await expect(pending).resolves.toBe(realId)
    })

    test("scopes synced rows per session key", async () => {
        const persist = mockPersist()
        const backend = createSeededClient({ liveRows: [placeFixture()] })

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
        persist.addPlace.mockRejectedValueOnce(new Error("mutation failed"))
        const backend = createSeededClient()
        const collections = getSessionCollections(backend.client, persist, SESSION)
        await collections.owner.preload()

        const tx = collections.owner.insert(
            buildTempPlace({
                ownerId: toId<"profiles">("user-1"),
                ownerName: "Alex",
                name: "Trattoria Verde",
                cuisine: "Italian",
                addressLabel: "Luxembourg City",
                photos: [],
                previewUrls: new Map(),
                clientMutationId: "user-1:doomed",
            }),
        )
        expect(collections.owner.size).toBe(1)
        await tx.when("settled").catch(() => {})

        expect(tx.state).toBe("failed")
        expect(collections.owner.size).toBe(0)
    })

    test("isolates user data across sign-out to a different user", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({
            data: { user: { id: "anna", email: "anna@example.com", name: "Anna" } },
            error: null,
        })
        const annasBackend = createSeededClient({
            liveRows: [placeFixture({ ownerId: toId<"profiles">("anna"), ownerName: "Anna" })],
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
            liveRows: [placeFixture({ ownerId: toId<"profiles">("ben"), ownerName: "Ben", name: "Sushi Bar" })],
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
        const gated = createSeededClient({ liveRows: [placeFixture()] })
        injectSyncClient(gated.client)
        const queryClient = new QueryClient()
        const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        )

        const { result, unmount } = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => vi.mocked(authClient.getSession)).toHaveBeenCalled()
        await expect.poll(() => result.current).toBeUndefined()
        expect(result.current).toBeUndefined()
        expect(gated.subscriberCount()).toBe(0)
        unmount()

        tokenMock.mockResolvedValue({ data: { token: "test-token" } })
        const backend = createSeededClient({ liveRows: [placeFixture()] })
        injectSyncClient(backend.client)

        const second = renderHook(() => useRestaurants(), { wrapper })
        await expect.poll(() => second.result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        expect(backend.subscriberCount()).toBeGreaterThan(0)
    })

    describe("collection recovery", () => {
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
    })
})
