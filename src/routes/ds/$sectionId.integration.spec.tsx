import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../../routeTree.gen"
import { authSnapshotFor } from "../../vitest.auth"
import { renderDocument } from "../../vitest.render"
import { buttonMeta } from "./-sections/button"
import { textLinkMeta } from "./-sections/text-link"

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

function expectGuidanceAboveDemo(guidanceText: string, demoName: string): void {
    const guidance = screen.getByText(guidanceText)
    const demo = screen.getByRole("button", { name: demoName })
    expect(guidance.compareDocumentPosition(demo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0)
}

describe("design-system section page", () => {
    test("renders button guidance above the demo", async () => {
        await renderAt("/ds/button")
        await waitFor(() => {
            expect(screen.getByText(buttonMeta.guidance.whenToUse)).toBeInTheDocument()
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument()
        })
        expectGuidanceAboveDemo(buttonMeta.guidance.whenToUse, "Primary")
    })

    test("renders text-link guidance above the demo", async () => {
        await renderAt("/ds/text-link")
        await waitFor(() => {
            expect(screen.getByText(textLinkMeta.guidance.whenToUse)).toBeInTheDocument()
        })
        await waitFor(() => {
            expect(screen.getByRole("link", { name: "See the list" })).toBeInTheDocument()
        })
        const guidance = screen.getByText(textLinkMeta.guidance.whenToUse)
        const demo = screen.getByRole("link", { name: "See the list" })
        expect(guidance.compareDocumentPosition(demo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0)
    })
})
