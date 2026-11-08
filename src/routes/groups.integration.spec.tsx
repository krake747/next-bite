import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded.client"

import { routeTree } from "../routeTree.gen"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

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
        useAuth: () => ({
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

async function renderAt(path: string): Promise<void> {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "g9" })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    await waitFor(() => {
        expect(document.querySelector('[data-slot="page-layout"]')).toBeInTheDocument()
    })
}

function ownerRestaurant(overrides?: Partial<Omit<RestaurantDoc, "_id">> & { _id?: string }): RestaurantDoc {
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

describe("groups list", () => {
    test("renders the caller's groups", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:listMyGroups", undefined, [{ group: { _id: "g1", name: "Food Crew" }, role: "admin" }])
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Food Crew" })).toHaveAttribute("href", "/groups/g1")
        })
    })

    test("shows an actionable empty state with no groups", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:listMyGroups", undefined, [])
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByText("No groups yet")).toBeInTheDocument()
        })
        expect(screen.getByLabelText("New group")).toBeInTheDocument()
    })

    test("asks signed-out visitors to sign in", async () => {
        testUser = null
        querySeeds.clear()
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument()
        })
    })

    test("creates a group from the form", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:listMyGroups", undefined, [])
        mutationCalls.length = 0
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByLabelText("New group")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("New group"), { target: { value: "Sunday Crew" } })
        fireEvent.click(screen.getByRole("button", { name: "Create group" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "groups:createGroup", args: { name: "Sunday Crew" } })
        })
    })
})

describe("group detail", () => {
    const groupId = "g1"

    function seedDetail(): void {
        seedQuery("groups:listMyGroups", undefined, [{ group: { _id: groupId, name: "Food Crew" }, role: "admin" }])
        seedQuery(
            "groups:getGroup",
            { groupId },
            {
                group: { _id: groupId, name: "Food Crew" },
                role: "admin",
                members: [
                    { userId: "user-1", name: "Alex", role: "admin" },
                    { userId: "ben", name: "Ben", role: "member" },
                ],
            },
        )
        seedQuery("shares:listForGroup", { groupId }, [ownerRestaurant({ visibility: "shared" })])
        seedQuery("restaurants:get", undefined, [ownerRestaurant({ _id: "r2", name: "Sushi Bar" })])
        seedQuery("social:getSummaries", { restaurantIds: ["r1"] }, [
            {
                restaurantId: "r1",
                wantCount: 2,
                beenCount: 1,
                wanted: false,
                likeCount: 0,
                liked: false,
                commentCount: 0,
                interestedNames: [],
            },
        ])
    }

    test("renders identity and members", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedDetail()
        await renderAt(`/groups/${groupId}`)

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        })
        expect(within(screen.getByLabelText("Members")).getByText("2 members")).toBeInTheDocument()
    })

    test("renders shared restaurants with social counts", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedDetail()
        await renderAt(`/groups/${groupId}`)

        await waitFor(() => {
            expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        })
        await waitFor(() => {
            expect(screen.getByText(/2 want · 1 been/)).toBeInTheDocument()
        })
    })

    test("shows the not-found card to strangers", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:listMyGroups", undefined, [])
        seedQuery("groups:getGroup", { groupId }, null)
        seedQuery("shares:listForGroup", { groupId }, [])
        seedQuery("restaurants:get", undefined, [])
        await renderAt(`/groups/${groupId}`)

        await waitFor(() => {
            expect(screen.getByText("Group not found")).toBeInTheDocument()
        })
    })

    test("removes only the caller's own shared place", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedDetail()
        mutationCalls.length = 0
        await renderAt(`/groups/${groupId}`)

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Remove" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "shares:unshare",
                args: { restaurantId: "r1", target: { kind: "group", groupId } },
            })
        })
    })

    test("adds an unshared restaurant to the group", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedDetail()
        mutationCalls.length = 0
        await renderAt(`/groups/${groupId}`)

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Add to group" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Add to group" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "shares:shareWithGroup", args: { restaurantId: "r2", groupId } })
        })
    })
})
