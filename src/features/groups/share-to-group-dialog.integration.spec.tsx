import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { ConvexProvider } from "@core/convex-client"
import { createSeededClient, type MutationCall } from "@core/db/seeded-client"

import { ShareToGroupDialog } from "./share-to-group-dialog"

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

let testUser: { id: string; email: string; name: string } | null = {
    id: "user-1",
    email: "alex@example.com",
    name: "Alex",
}
const mutationCalls: MutationCall[] = []
const querySeeds = new Map<string, unknown>()

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

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
const restaurantId = "r1" as unknown as Id<"restaurants">

function renderDialog(): void {
    const queryClient = new QueryClient()
    render(
        <QueryClientProvider client={queryClient}>
            <ConvexProvider client={createSeededClient(querySeeds, mutationCalls, "s1")}>
                <ShareToGroupDialog
                    restaurantId={restaurantId}
                    restaurantName="Trattoria Verde"
                    show
                    onOpenChange={() => {}}
                />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

describe("share to group dialog", () => {
    it("shares with a group through Add to group", async () => {
        querySeeds.clear()
        mutationCalls.length = 0
        querySeeds.set("groups:listMyGroups|no-args", [{ group: { _id: "g1", name: "Food Crew" }, role: "admin" }])
        querySeeds.set('shares:listShares|{"restaurantId":"r1"}', [])
        renderDialog()

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Add to group" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Add to group" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "shares:shareWithGroup",
                args: { restaurantId: "r1", groupId: "g1" },
            })
        })
    })

    it("removes an existing group share", async () => {
        querySeeds.clear()
        mutationCalls.length = 0
        querySeeds.set("groups:listMyGroups|no-args", [{ group: { _id: "g1", name: "Food Crew" }, role: "admin" }])
        querySeeds.set('shares:listShares|{"restaurantId":"r1"}', [
            { _id: "s1", target: { kind: "group", groupId: "g1" }, displayName: "Food Crew" },
        ])
        renderDialog()

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Remove" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "shares:unshare",
                args: { restaurantId: "r1", target: { kind: "group", groupId: "g1" } },
            })
        })
    })
})
