import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { type Doc } from "@convex/_generated/dataModel"

import { routeTree } from "../routeTree.gen"

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

function friendSpot(name: string): Doc<"restaurants"> {
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
    } as unknown as Doc<"restaurants">
}

async function renderHome(feed: ReadonlyArray<Doc<"restaurants">>): Promise<void> {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["restaurants.feed", "no-args"], [...feed])
    queryClient.setQueryData(["restaurants.get", "no-args"], [])
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
        await renderHome([friendSpot("Trattoria Verde")])

        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
    })

    it("shows an empty state when no friend activity exists", async () => {
        await renderHome([])

        expect(screen.getByText("No crew activity yet")).toBeInTheDocument()
    })
})
