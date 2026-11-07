import { QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey, type MutationCall } from "@api/db/seeded.client"
import { type Id } from "@convex/_generated/dataModel"

import { ShareToGroupDialog } from "./share-to-group-dialog"

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

let testUser: { id: string; email: string; name: string } | null = {
    id: "user-1",
    email: "alex@example.com",
    name: "Alex",
}
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

async function renderDialog() {
    const backend = createSeededClient({ seeds: querySeeds, calls: mutationCalls, mutateResult: "s1" })
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client}>
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

// Direct dispatch: the unstyled test env leaves Base UI's inert backdrop above
// the panel, so Playwright hit-testing cannot reach dialog buttons.
function clickButton(button: { element: () => HTMLElement | SVGElement }): void {
    const node = button.element()
    if (!(node instanceof HTMLElement)) {
        throw new TypeError("Button not found")
    }
    node.click()
}

describe("share to group dialog", () => {
    test("shares with a group through Add to group", async () => {
        querySeeds.clear()
        mutationCalls.length = 0
        querySeeds.set(seedKey("groups:listMyGroups", undefined), [
            { group: { _id: "g1", name: "Food Crew" }, role: "admin" },
        ])
        querySeeds.set(seedKey("shares:listShares", { restaurantId: "r1" }), [])
        const screen = await renderDialog()

        await expect.element(screen.getByRole("button", { name: "Add to group" })).toBeInTheDocument()
        // Direct dispatch: the unstyled test env leaves Base UI's inert backdrop
        // above the panel, so Playwright hit-testing cannot reach dialog buttons.
        clickButton(screen.getByRole("button", { name: "Add to group" }))

        await expect
            .poll(() => mutationCalls)
            .toContainEqual({
                fn: "shares:shareWithGroup",
                args: { restaurantId: "r1", groupId: "g1" },
            })
    })

    test("removes an existing group share", async () => {
        querySeeds.clear()
        mutationCalls.length = 0
        querySeeds.set(seedKey("groups:listMyGroups", undefined), [
            { group: { _id: "g1", name: "Food Crew" }, role: "admin" },
        ])
        querySeeds.set(seedKey("shares:listShares", { restaurantId: "r1" }), [
            { _id: "s1", target: { kind: "group", groupId: "g1" }, displayName: "Food Crew" },
        ])
        const screen = await renderDialog()

        await expect.element(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
        clickButton(screen.getByRole("button", { name: "Remove" }))

        await expect
            .poll(() => mutationCalls)
            .toContainEqual({
                fn: "shares:unshare",
                args: { restaurantId: "r1", target: { kind: "group", groupId: "g1" } },
            })
    })
})
