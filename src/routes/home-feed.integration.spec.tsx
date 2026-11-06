import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, within, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@core/convex-client"
import { type RestaurantDoc } from "@core/db/restaurants"
import { createSeededClient } from "@core/db/seeded-client"

import { routeTree } from "../routeTree.gen"

vi.mock("@core/auth-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/auth-client")>()
    return {
        ...original,
        getConvexSessionToken: vi.fn<() => Promise<string | null>>(async () => {
            await Promise.resolve()
            return "test-token"
        }),
    }
})

vi.mock("@core/auth-provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/auth-provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuth: () => ({
            isAuthenticated: true,
            isLoading: false,
            user: { id: "user-1", email: "alex@example.com", name: "Alex" },
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
    const queryClient = new QueryClient()
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
        context: { queryClient },
    })
    await router.load()
    render(
        <ConvexProvider client={createSeededClient({ liveRows: feed }).client}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[aria-label="Latest activity"]')).toBeInTheDocument()
    })
}

describe("home friends feed", () => {
    test("shows a friend's discovery in latest activity", async () => {
        await renderHome([friendRestaurant("Trattoria Verde")])

        const activity = screen.getByLabelText("Latest activity")
        expect(within(activity).getByText("Trattoria Verde")).toBeInTheDocument()
    })

    test("shows an empty state when no friend activity exists", async () => {
        await renderHome([])

        expect(screen.getByText("No crew activity yet")).toBeInTheDocument()
    })
})
