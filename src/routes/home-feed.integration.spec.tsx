import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, within, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../routeTree.gen"

vi.mock("@api/auth.sdk", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.sdk")>()
    return {
        ...original,
        getConvexSessionToken: vi.fn<() => Promise<string | null>>(async () => {
            await Promise.resolve()
            return "test-token"
        }),
    }
})

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

function ownedRestaurant(name: string, owner: { id: string; name: string }, id: string): RestaurantDoc {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the restaurant document
    return {
        _id: id,
        _creationTime: 1000,
        ownerId: owner.id,
        ownerName: owner.name,
        name,
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "shared",
        createdAt: 1000,
    } as unknown as RestaurantDoc
}

async function renderHome(
    feed: ReadonlyArray<RestaurantDoc>,
    friends: ReadonlyArray<{ authUserId: string; name: string }> = [],
): Promise<void> {
    // The _app beforeLoad redirects without a cached session; auth here is
    // always signed-in, so seed the slot hasCachedSession reads.
    localStorage.setItem("nb:session", JSON.stringify({ id: "user-1", email: "alex@example.com", name: "Alex" }))
    const seeds = new Map<string, unknown>([[seedKey("friendships:listFriends", undefined), friends]])
    const backend = createSeededClient({ seeds, liveRows: feed })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/home"] }),
        context: { queryClient: backend.queryClient },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[aria-label="Welcome back"]')).toBeInTheDocument()
    })
}

describe("home friends feed", () => {
    test("shows a friend's discovery in latest activity", async () => {
        await renderHome([ownedRestaurant("Trattoria Verde", { id: "anna", name: "Anna" }, "r1")])

        const activity = screen.getByLabelText("Latest activity")
        expect(within(activity).getByText("Trattoria Verde")).toBeInTheDocument()
    })

    test("shows a single first-run empty state when nothing exists", async () => {
        await renderHome([])

        expect(screen.getByLabelText("Saved restaurants")).toBeInTheDocument()
        expect(screen.getByText("The table is set, but empty")).toBeInTheDocument()
        expect(screen.queryByText("No friend saves yet")).not.toBeInTheDocument()
    })

    test("shows personal saves without friend pills", async () => {
        await renderHome(
            [ownedRestaurant("Trattoria Verde", { id: "user-1", name: "Alex" }, "r1")],
            [{ authUserId: "user-2", name: "Ben" }],
        )

        const saved = screen.getByLabelText("Latest activity")
        expect(within(saved).getByText("Trattoria Verde")).toBeInTheDocument()
        expect(within(saved).queryByRole("button", { name: "Ben" })).toBeNull()
    })

    test("interleaves friend saves with your own newest first", async () => {
        await renderHome(
            [
                ownedRestaurant("Sushi Bar", { id: "user-2", name: "Ben" }, "r2"),
                ownedRestaurant("Trattoria Verde", { id: "user-1", name: "Alex" }, "r1"),
            ],
            [{ authUserId: "user-2", name: "Ben" }],
        )

        const saved = screen.getByLabelText("Latest activity")
        await waitFor(() => {
            expect(within(saved).getByText("Sushi Bar")).toBeInTheDocument()
        })
        expect(within(saved).getByText("Trattoria Verde")).toBeInTheDocument()
    })
})
