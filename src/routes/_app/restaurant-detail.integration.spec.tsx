import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { toId, type Id } from "@api/data.model"
import { type PlaceCard } from "@api/db/restaurants"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"
import { renderDocument } from "../../vitest.render"

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
            user: { id: "user-1", email: "alex@example.com", name: "Alex" },
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

const alex = { id: "user-1", email: "alex@example.com", name: "Alex" }
const restaurantId = toId<"places">("r1")

const verde: PlaceCard = {
    _id: restaurantId,
    _creationTime: 1000,
    ownerId: toId<"profiles">(alex.id),
    ownerName: alex.name,
    name: "Trattoria Verde",
    cuisine: "Italian",
    address: { label: "Luxembourg City", google: { placeId: "ChIJtest" } },
    photos: [],
    mySave: null,
    wantCount: 0,
}

const enterpriseDetails = {
    openingHours: {
        openState: "open",
        periods: [],
        weekdayText: ["Monday: 9:00 AM – 5:00 PM"],
    },
    rating: 4.5,
    ratingCount: 123,
    priceLevel: "PRICE_LEVEL_MODERATE",
    websiteUri: "https://example.com/trattoria",
}

function isSeededStorageId(value: string): value is Id<"_storage"> {
    return value.length > 0
}

function mustBeStorageId(value: string): Id<"_storage"> {
    if (!isSeededStorageId(value)) {
        throw new Error("Test photo needs a storage id")
    }
    return value
}

function detailCalls(actionCalls: ReadonlyArray<MutationCall>): ReadonlyArray<MutationCall> {
    return actionCalls.filter((call) => call.fn === "places:details")
}

describe("restaurant detail enterprise wiring", () => {
    test("granular pro plus enterprise calls cover the fields and the hours dialog", async () => {
        const actionCalls: MutationCall[] = []
        const seeds = new Map<string, unknown>([
            [seedKey("places:get", { id: restaurantId }), verde],
            [seedKey("places:details", { placeId: restaurantId, tier: "enterprise" }), enterpriseDetails],
            [seedKey("places:details", { placeId: restaurantId, tier: "pro" }), {}],
            [seedKey("social:friends", undefined), []],
            [seedKey("social:requests", undefined), { incoming: [], outgoing: [] }],
        ])
        const backend = createSeededClient({ seeds, actionCalls })
        const router = createRouter({
            routeTree,
            history: createMemoryHistory({
                initialEntries: [`/restaurants/${restaurantId}`],
            }),
            context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(alex) },
        })
        await router.load()
        renderDocument(
            <ConvexProvider client={backend.client} auth="authenticated">
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        expect(await screen.findByText("4.5")).toBeInTheDocument()
        expect(screen.getByText("(123)")).toBeInTheDocument()
        expect(screen.getByText("$$")).toBeInTheDocument()
        expect(screen.getByText("Website")).toBeInTheDocument()
        expect(detailCalls(actionCalls)).toHaveLength(2)

        await userEvent.click(screen.getByRole("button", { name: "Hours" }))
        expect(await screen.findByText("9:00 AM – 5:00 PM")).toBeInTheDocument()
        await waitFor(() => {
            expect(detailCalls(actionCalls)).toHaveLength(2)
        })
    })

    test("flags a permanently closed place above the hero", async () => {
        const actionCalls: MutationCall[] = []
        const seeds = new Map<string, unknown>([
            [seedKey("places:get", { id: restaurantId }), verde],
            [seedKey("places:details", { placeId: restaurantId, tier: "enterprise" }), enterpriseDetails],
            [
                seedKey("places:details", { placeId: restaurantId, tier: "pro" }),
                { businessStatus: "CLOSED_PERMANENTLY" },
            ],
            [seedKey("social:friends", undefined), []],
            [seedKey("social:requests", undefined), { incoming: [], outgoing: [] }],
        ])
        const backend = createSeededClient({ seeds, actionCalls })
        const router = createRouter({
            routeTree,
            history: createMemoryHistory({
                initialEntries: [`/restaurants/${restaurantId}`],
            }),
            context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(alex) },
        })
        await router.load()
        renderDocument(
            <ConvexProvider client={backend.client} auth="authenticated">
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        expect(await screen.findByText("Permanently closed")).toBeInTheDocument()
        expect(detailCalls(actionCalls)).toHaveLength(2)
    })

    test("shows the photo carousel with add for the owner", async () => {
        const calls: MutationCall[] = []
        const photo = (id: string) => ({
            url: `https://example.com/${id}.jpg`,
            storageId: mustBeStorageId(id),
            addedBy: toId<"profiles">(alex.id),
        })
        const withPhotos: PlaceCard = { ...verde, photos: [photo("s1"), photo("s2")] }
        const seeds = new Map<string, unknown>([
            [seedKey("places:get", { id: restaurantId }), withPhotos],
            [seedKey("places:details", { placeId: restaurantId, tier: "enterprise" }), enterpriseDetails],
            [seedKey("places:details", { placeId: restaurantId, tier: "pro" }), {}],
            [seedKey("social:friends", undefined), []],
            [seedKey("social:requests", undefined), { incoming: [], outgoing: [] }],
            [
                seedKey("identity:me", undefined),
                { status: "ready", profile: { _id: "user-1", authUserId: "user-1", name: "Alex" } },
            ],
        ])
        const backend = createSeededClient({ seeds, calls })
        const router = createRouter({
            routeTree,
            history: createMemoryHistory({
                initialEntries: [`/restaurants/${restaurantId}`],
            }),
            context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(alex) },
        })
        await router.load()
        renderDocument(
            <ConvexProvider client={backend.client} auth="authenticated">
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        expect(await screen.findByRole("button", { name: "Go to slide 2" })).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Open photo viewer at image 1" })).not.toBeInTheDocument()

        await userEvent.click(screen.getByRole("button", { name: "Add photos" }))
        const dialog = await screen.findByRole("dialog", { name: "Add photos" })
        expect(dialog).toBeInTheDocument()
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    })
})
