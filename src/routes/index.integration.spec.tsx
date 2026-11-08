import { QueryClient } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"

import { routeTree } from "../routeTree.gen"

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuth: () => ({
            isAuthenticated: false,
            isLoading: false,
            user: null,
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

describe("signed-out landing without a convex client", () => {
    test("renders the skeleton instead of throwing, mirroring server output", async () => {
        const router = createRouter({
            routeTree,
            history: createMemoryHistory({ initialEntries: ["/"] }),
            context: { queryClient: new QueryClient() },
        })
        await router.load()
        render(
            <ConvexProvider client={null}>
                <RouterProvider router={router} />
            </ConvexProvider>,
        )

        // The server renders with a null client too, so the skeleton is the
        // server HTML: it must paint without a connected client or SSR falls
        // back to client rendering.
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Your friends have good taste." })).toBeInTheDocument()
        })
        expect(screen.getByRole("region", { name: "Sample community activity" })).toBeInTheDocument()
    })
})
