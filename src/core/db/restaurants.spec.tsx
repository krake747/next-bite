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
    getRestaurantCollections,
    toAddArgs,
    toUpdateArgs,
    type RestaurantDoc,
} from "./restaurants"

let injectedClient: ConvexClient | null = null

vi.mock("../convex-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("../convex-client")>()
    return { ...original, useConvexClient: () => injectedClient }
})

function injectSyncClient(syncClient: unknown): void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
    injectedClient = syncClient as ConvexClient
}

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
            token: vi.fn<() => Promise<{ data: null }>>(async () => {
                await Promise.resolve()
                return { data: null }
            }),
        },
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
        addRestaurant: vi.fn<() => Promise<Id<"restaurants">>>(async () => {
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
})

describe("restaurant collections", () => {
    it("shows an optimistic update immediately and converges on sync", async () => {
        const persist = mockPersist()
        const backend = mockBackend([restaurantFixture()])
        const collections = getRestaurantCollections(backend.syncClient, persist)
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
        const collections = getRestaurantCollections(backend.syncClient, persist)
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
        const collections = getRestaurantCollections(backend.syncClient, persist)
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

    it("returns collection rows from the restaurants hook", async () => {
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)

        const { result } = renderHook(() => useRestaurants(), {
            wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => <AuthProvider>{children}</AuthProvider>,
        })

        await vi.waitFor(() => {
            expect(result.current?.map((r) => r.name)).toEqual(["Trattoria Verde"])
        })
    })

    it("returns undefined from the restaurants hook when signed out", async () => {
        vi.mocked(authClient.getSession).mockResolvedValue({ data: { user: null }, error: null })
        const backend = mockBackend([restaurantFixture()])
        injectSyncClient(backend.syncClient)

        const { result } = renderHook(
            () => {
                const auth = useProbeAuth()
                return { restaurants: useRestaurants(), authed: auth.isAuthenticated }
            },
            {
                wrapper: ({ children }: Readonly<{ children: React.ReactNode }>) => (
                    <AuthProvider>{children}</AuthProvider>
                ),
            },
        )

        await vi.waitFor(() => {
            expect(result.current).not.toBeNull()
        })
        expect(result.current.restaurants).toBeUndefined()
        expect(result.current.authed).toBe(false)
    })
})
