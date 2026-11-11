import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { type PlaceCard } from "@api/db/restaurants"
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

async function renderAt(path: string): Promise<void> {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "g9" })
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

function ownerPlace(overrides?: Partial<Omit<PlaceCard, "_id">> & { _id?: string }): PlaceCard {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the place card
    return {
        _id: "r1",
        _creationTime: 1000,
        ownerId: "user-1",
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

describe("groups list", () => {
    test("renders the caller's groups", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:list", undefined, [{ group: { _id: "g1", name: "Food Crew" }, isOwner: true }])
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Food Crew" })).toHaveAttribute("href", "/groups/g1")
        })
    })

    test("shows an actionable empty state with no groups", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:list", undefined, [])
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByText("No groups yet")).toBeInTheDocument()
        })
        expect(screen.getByLabelText("New group")).toBeInTheDocument()
    })

    test("redirects signed-out visitors to login with a return path", async () => {
        testUser = null
        querySeeds.clear()
        const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "g9" })
        const router = createRouter({
            routeTree,
            history: createMemoryHistory({ initialEntries: ["/groups"] }),
            context: { queryClient: backend.queryClient, authSnapshot: authSnapshotFor(testUser) },
        })
        await router.load()
        renderDocument(
            <ConvexProvider client={backend.client} auth="authenticated">
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
        })
        expect(router.state.location.pathname).toBe("/login")
        expect(router.state.location.search).toEqual({ redirect: "/groups" })
    })

    test("creates a group from the form", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:list", undefined, [])
        mutationCalls.length = 0
        await renderAt("/groups")

        await waitFor(() => {
            expect(screen.getByLabelText("New group")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("New group"), { target: { value: "Sunday Crew" } })
        fireEvent.click(screen.getByRole("button", { name: "Create group" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "groups:create", args: { name: "Sunday Crew" } })
        })
    })
})

describe("group detail", () => {
    const groupId = "g1"

    function seedDetail(): void {
        seedQuery("identity:me", undefined, {
            status: "ready",
            profile: { _id: "user-1", authUserId: "user-1", name: "Alex", email: "alex@example.com" },
        })
        seedQuery("groups:list", undefined, [{ group: { _id: groupId, name: "Food Crew" }, isOwner: true }])
        seedQuery(
            "groups:get",
            { groupId },
            {
                group: { _id: groupId, name: "Food Crew" },
                isOwner: true,
                members: [
                    { userId: "user-1", name: "Alex", isOwner: true },
                    { userId: "ben", name: "Ben", isOwner: false },
                ],
            },
        )
        seedQuery("places:forGroup", { groupId }, [ownerPlace({ wantCount: 2 })])
        seedQuery("places:mine", undefined, [ownerPlace({ _id: "r2", name: "Sushi Bar" })])
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
            expect(screen.getByText(/2 want/)).toBeInTheDocument()
        })
    })

    test("shows the not-found card to strangers", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("groups:list", undefined, [])
        seedQuery("groups:get", { groupId }, null)
        seedQuery("places:forGroup", { groupId }, [])
        seedQuery("places:mine", undefined, [])
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
                fn: "places:removeFromGroup",
                args: { placeId: "r1", groupId },
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
            expect(mutationCalls).toContainEqual({ fn: "places:addToGroup", args: { placeId: "r2", groupId } })
        })
    })
})
