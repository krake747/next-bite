import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
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

function seedReadyProfile(): void {
    seedQuery("users:getMe", undefined, {
        status: "ready",
        profile: { _id: "p1", authUserId: "user-1", name: "Alex", email: "alex@example.com", createdAt: 1 },
    })
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

describe("account screen", () => {
    test("shows the onboarding form without user details", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedQuery("users:getMe", undefined, { status: "onboarding" })
        await renderAt("/account")

        await waitFor(() => {
            expect(screen.getByText("Complete your details")).toBeInTheDocument()
        })
    })

    test("saves an edited display name on blur", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedReadyProfile()
        mutationCalls.length = 0
        await renderAt("/account")

        await waitFor(() => {
            expect(screen.getByDisplayValue("Alex")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alexander" } })
        fireEvent.blur(screen.getByLabelText("Display name"))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({ fn: "users:updateMe", args: { name: "Alexander" } })
        })
        expect(screen.getByDisplayValue("Alexander")).toBeInTheDocument()
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    test("skips the update when the display name is unchanged", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedReadyProfile()
        mutationCalls.length = 0
        await renderAt("/account")

        await waitFor(() => {
            expect(screen.getByDisplayValue("Alex")).toBeInTheDocument()
        })
        fireEvent.blur(screen.getByLabelText("Display name"))

        expect(mutationCalls.filter((call) => call.fn === "users:updateMe")).toHaveLength(0)
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    test("shows an error for an empty display name", async () => {
        testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
        querySeeds.clear()
        seedReadyProfile()
        mutationCalls.length = 0
        await renderAt("/account")

        await waitFor(() => {
            expect(screen.getByDisplayValue("Alex")).toBeInTheDocument()
        })
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "   " } })
        fireEvent.blur(screen.getByLabelText("Display name"))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Name cannot be empty")
        })
        expect(mutationCalls.filter((call) => call.fn === "users:updateMe")).toHaveLength(0)
    })
})
