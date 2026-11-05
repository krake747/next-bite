import { render, screen, waitFor } from "@testing-library/react"
import { ConvexClient } from "convex/browser"
import { describe, expect, it, vi } from "vitest"

import { AuthProvider } from "./auth-provider"

vi.mock("./auth-client", () => ({
    authClient: {
        useSession: () => ({
            data: {
                session: { id: "session-1", token: "token-1" },
                user: { id: "user-1", email: "alex@example.com" },
            },
            isPending: false,
        }),
        getSession: vi.fn<() => Promise<{ data: { user: { id: string; email: string } }; error: null }>>(async () => {
            await Promise.resolve()
            return {
                data: { user: { id: "user-1", email: "alex@example.com" } },
                error: null,
            }
        }),
        convex: {
            token: vi.fn<() => Promise<{ data: null }>>(async () => {
                await Promise.resolve()
                return { data: null }
            }),
        },
    },
}))

describe("AuthProvider", () => {
    it("attaches the Better Auth token fetcher to the Convex client", async () => {
        const setAuth = vi.spyOn(ConvexClient.prototype, "setAuth").mockImplementation(() => {})
        try {
            render(
                <AuthProvider>
                    <p>ready</p>
                </AuthProvider>,
            )
            await waitFor(() => {
                expect(screen.getByText("ready")).toBeInTheDocument()
            })
            await waitFor(() => {
                expect(setAuth).toHaveBeenCalledTimes(1)
            })
            expect(typeof setAuth.mock.calls[0]?.[0]).toBe("function")
        } finally {
            setAuth.mockRestore()
        }
    })
})
