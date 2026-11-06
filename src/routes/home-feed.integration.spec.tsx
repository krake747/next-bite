import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, within, waitFor } from "@testing-library/react"
import { type ConvexClient } from "convex/browser"
import { describe, expect, it, vi } from "vitest"

import { mockBackend } from "@core/db/mock-sync-client"
import { type RestaurantDoc } from "@core/db/restaurants"

import { routeTree } from "../routeTree.gen"

let injectedClient: ConvexClient | null = null

vi.mock("@core/convex-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/convex-client")>()
    return { ...original, useConvexClient: () => injectedClient }
})

function injectSyncClient(syncClient: unknown): void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
    injectedClient = syncClient as ConvexClient
}

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

function friendRestaurant(name: string): RestaurantDoc {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the restaurant document
    return {
        _id: "r1",
        _creationTime: 1000,
        ownerId: "anna",
        ownerName: "Anna",
        name,
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "shared",
        createdAt: 1000,
    } as unknown as RestaurantDoc
}

async function renderHome(feed: ReadonlyArray<RestaurantDoc>): Promise<void> {
    injectSyncClient(mockBackend(feed).syncClient)
    const queryClient = new QueryClient()
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
        context: { queryClient },
    })
    await router.load()
    render(<RouterProvider router={router} />)
    await waitFor(() => {
        expect(document.querySelector('[aria-label="Latest activity"]')).toBeInTheDocument()
    })
}

describe("home friends feed", () => {
    it("shows a friend's discovery in latest activity", async () => {
        await renderHome([friendRestaurant("Trattoria Verde")])

        const activity = screen.getByLabelText("Latest activity")
        expect(within(activity).getByText("Trattoria Verde")).toBeInTheDocument()
    })

    it("shows an empty state when no friend activity exists", async () => {
        await renderHome([])

        expect(screen.getByText("No crew activity yet")).toBeInTheDocument()
    })
})
