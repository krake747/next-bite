import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"
import { renderDocument } from "../../vitest.render"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => ({
            isAuthenticated: testUser !== null,
            isLoading: false,
            user: testUser,
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

function seedQuery(fn: string, args: unknown, value: unknown): void {
    querySeeds.set(seedKey(fn, args), value)
}

function savedRestaurant(overrides?: Partial<Omit<RestaurantDoc, "_id">> & { _id?: string }): RestaurantDoc {
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
        ...overrides,
    } as unknown as RestaurantDoc
}

function seedYou(): void {
    seedQuery("restaurants:get", undefined, [
        savedRestaurant(),
        savedRestaurant({ _id: "r2", name: "Sushi Bar", cuisine: "Japanese" }),
    ])
    seedQuery("social:listMyStatuses", undefined, [{ restaurantId: "r2", status: "want" }])
}

async function renderAt(path: string): Promise<void> {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "p9" })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(testUser) },
    })
    await router.load()
    renderDocument(
        <ConvexProvider client={backend.client} auth="authenticated">
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[data-slot="page-layout"]')).toBeInTheDocument()
    })
}

describe("you screen", () => {
    test("renders saved, want, and been counts", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedYou()
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByText("Saved · 2")).toBeInTheDocument()
        })
        expect(screen.getByText("Want to try · 1")).toBeInTheDocument()
        expect(screen.getByText("Been · 0")).toBeInTheDocument()
        expect(screen.getAllByText("Sushi Bar")).toHaveLength(2)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
    })

    test("shows empty states with no saves", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("restaurants:get", undefined, [])
        seedQuery("social:listMyStatuses", undefined, [])
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByText("Saved · 0")).toBeInTheDocument()
        })
        expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument()
    })
})
