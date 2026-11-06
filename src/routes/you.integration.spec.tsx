import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@core/convex-client"
import { type RestaurantDoc } from "@core/db/restaurants"
import { createSeededClient, seedKey, type MutationCall } from "@core/db/seeded-client"

import { routeTree } from "../routeTree.gen"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

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
            isAuthenticated: testUser !== null,
            isLoading: false,
            user: testUser,
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
        createdAt: 1000,
        ...overrides,
    } as unknown as RestaurantDoc
}

function seedYou(): void {
    seedQuery("users:getMe", undefined, {
        status: "ready",
        profile: { _id: "p1", authUserId: "user-1", name: "Alex", email: "alex@example.com", createdAt: 1 },
    })
    seedQuery("restaurants:get", undefined, [
        savedRestaurant(),
        savedRestaurant({ _id: "r2", name: "Sushi Bar", cuisine: "Japanese" }),
    ])
    seedQuery("social:listMyStatuses", undefined, [{ restaurantId: "r2", status: "want" }])
}

async function renderAt(path: string): Promise<void> {
    const queryClient = new QueryClient()
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient },
    })
    await router.load()
    render(
        <ConvexProvider
            client={createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "p9" }).client}
        >
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[data-slot="page-layout"]')).toBeInTheDocument()
    })
}

describe("you screen", () => {
    test("renders the profile with saved, want, and been counts", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedYou()
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByDisplayValue("Alex")).toBeInTheDocument()
        })
        expect(screen.getByText("Saved · 2")).toBeInTheDocument()
        expect(screen.getByText("Want to try · 1")).toBeInTheDocument()
        expect(screen.getByText("Been · 0")).toBeInTheDocument()
        expect(screen.getAllByText("Sushi Bar")).toHaveLength(2)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
    })

    test("saves an edited display name", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedYou()
        mutationCalls.length = 0
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByDisplayValue("Alex")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alexander" } })
        fireEvent.click(screen.getByRole("button", { name: "Save" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "users:updateMe", args: { name: "Alexander" } })
        })
    })

    test("shows the onboarding form without a profile", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("users:getMe", undefined, { status: "onboarding" })
        seedQuery("restaurants:get", undefined, [])
        seedQuery("social:listMyStatuses", undefined, [])
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByText("Complete your profile")).toBeInTheDocument()
        })
    })

    test("shows empty states with no saves", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("users:getMe", undefined, {
            status: "ready",
            profile: { _id: "p1", authUserId: "user-1", name: "Alex", email: "alex@example.com", createdAt: 1 },
        })
        seedQuery("restaurants:get", undefined, [])
        seedQuery("social:listMyStatuses", undefined, [])
        await renderAt("/you")

        await waitFor(() => {
            expect(screen.getByText("Saved · 0")).toBeInTheDocument()
        })
        expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument()
    })
})
