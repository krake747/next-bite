import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"
import { renderDocument } from "../../vitest.render"

type TestUser = { id: string; email: string; name: string }

const testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }

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

async function renderAt(path: string): Promise<void> {
    const seeds = new Map<string, unknown>([
        [
            seedKey("identity:me", undefined),
            {
                status: "ready",
                profile: { _id: "p1", authUserId: "user-1", name: "Alex", email: "alex@example.com" },
            },
        ],
    ])
    const backend = createSeededClient({ seeds })
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
}

function shellTriggers(): Element[] {
    const shell = document.querySelector('[data-slot="ds-shell"]')
    if (shell === null) {
        throw new Error("design-system shell did not render")
    }
    return [...shell.querySelectorAll("[data-base-ui-tooltip-trigger],[data-base-ui-click-trigger]")]
}

describe("design-system shell trigger ids", () => {
    test("every shell trigger carries a stable caller id", async () => {
        await renderAt("/ds/button")
        await waitFor(() => {
            expect(document.querySelector('[data-slot="ds-shell"]')).not.toBeNull()
        })

        const triggers = shellTriggers()
        expect(triggers.length).toBeGreaterThan(0)
        const ids = triggers.map((trigger) => trigger.getAttribute("id"))
        for (const id of ids) {
            expect(id).not.toBeNull()
            expect(id?.startsWith("base-ui-")).toBe(false)
        }
        expect(new Set(ids).size).toBe(ids.length)
    })

    test("shell landmarks keep their documented ids", async () => {
        await renderAt("/ds/button")
        await waitFor(() => {
            expect(document.querySelector('[data-slot="ds-shell"]')).not.toBeNull()
        })

        const shell = document.querySelector('[data-slot="ds-shell"]')
        expect(shell?.querySelector("#ds-sidebar-trigger")).not.toBeNull()
        expect(shell?.querySelector("#ds-header-sidebar-trigger")).not.toBeNull()
        expect(shell?.querySelector("#ds-menu-trigger")).not.toBeNull()
        expect(shell?.querySelector("#ds-nav-overview")).not.toBeNull()
    })
})
