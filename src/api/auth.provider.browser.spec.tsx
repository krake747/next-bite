import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { AuthProvider } from "./auth.provider"
import { useConvexAuthPhase } from "./convex.context"

function PhaseProbe() {
    return <p>convex: {useConvexAuthPhase()}</p>
}

type FetchToken = (options: { forceRefreshToken: boolean }) => Promise<string | null>

const { constructed } = vi.hoisted(() => ({
    constructed: [] as { fetchTokens: FetchToken[]; authChanges: ((isAuthenticated: boolean) => void)[] }[],
}))

vi.mock("convex/react", async (importOriginal) => {
    const original = await importOriginal<typeof import("convex/react")>()
    return {
        ...original,
        ConvexReactClient: class {
            fetchTokens: FetchToken[] = []
            authChanges: ((isAuthenticated: boolean) => void)[] = []
            clearedAuthCalls = 0
            constructor() {
                constructed.push(this)
            }
            setAuth(fetchToken: FetchToken, onChange: (isAuthenticated: boolean) => void): void {
                this.fetchTokens.push(fetchToken)
                this.authChanges.push(onChange)
            }
            clearAuth(): void {
                this.clearedAuthCalls += 1
            }
        },
    }
})

vi.mock("./auth.sdk", () => ({
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
        await expect.poll(() => constructed[0]?.fetchTokens.length).toBeGreaterThan(0)
        const fetchToken = constructed[0]?.fetchTokens[0]
        expect(fetchToken).toBeTypeOf("function")
        await expect(fetchToken?.({ forceRefreshToken: false })).resolves.toBe("convex-jwt-1")
    })

    test("exposes the official Convex auth signal as the readiness phase", async () => {
        const screen = await render(
            <QueryClientProvider client={new QueryClient()}>
                <AuthProvider>
                    <PhaseProbe />
                </AuthProvider>
            </QueryClientProvider>,
        )
        await expect.element(screen.getByText("convex: connecting")).toBeInTheDocument()
        await expect.poll(() => constructed.at(-1)?.authChanges.length).toBeGreaterThan(0)

        constructed.at(-1)?.authChanges.at(-1)?.(true)
        await expect.element(screen.getByText("convex: authenticated")).toBeInTheDocument()

        constructed.at(-1)?.authChanges.at(-1)?.(false)
        await expect.element(screen.getByText("convex: unauthenticated")).toBeInTheDocument()
    })
})
