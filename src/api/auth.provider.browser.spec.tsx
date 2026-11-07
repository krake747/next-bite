import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { AuthProvider } from "./auth.provider"

type FetchToken = (options: { forceRefreshToken: boolean }) => Promise<string | null>

const { constructed } = vi.hoisted(() => ({ constructed: [] as { fetchTokens: FetchToken[] }[] }))

// The provider owns a ConvexReactClient, but the suite never dials a backend: stub the client to a
// non-connecting shape that records its auth wiring. Hooks under test read the injected seeded
// client, so this stub only silences the provider-owned connection.
vi.mock("convex/react", async (importOriginal) => {
    const original = await importOriginal<typeof import("convex/react")>()
    return {
        ...original,
        ConvexReactClient: class {
            fetchTokens: FetchToken[] = []
            clearedAuthCalls = 0
            constructor() {
                constructed.push(this)
            }
            setAuth(fetchToken: FetchToken): void {
                this.fetchTokens.push(fetchToken)
            }
            clearAuth(): void {
                this.clearedAuthCalls += 1
            }
        },
    }
})

vi.mock("./auth.client", () => ({
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
            token: vi.fn<() => Promise<{ data: { token: string } }>>(async () => {
                await Promise.resolve()
                return { data: { token: "convex-jwt-1" } }
            }),
        },
    },
}))

describe("AuthProvider", () => {
    test("provides the Better Auth session token to the Convex client", async () => {
        const screen = await render(
            <QueryClientProvider client={new QueryClient()}>
                <AuthProvider>
                    <p>ready</p>
                </AuthProvider>
            </QueryClientProvider>,
        )
        await expect.element(screen.getByText("ready")).toBeInTheDocument()
        await vi.waitFor(() => {
            expect(constructed[0]?.fetchTokens.length).toBeGreaterThan(0)
        })
        const fetchToken = constructed[0]?.fetchTokens[0]
        expect(fetchToken).toBeTypeOf("function")
        await expect(fetchToken?.({ forceRefreshToken: false })).resolves.toBe("convex-jwt-1")
    })
})
