import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider, type ConvexAuthPhase } from "@api/convex.context"
import { createSeededClient } from "@api/db/seeded.client"
import { useSessionStatus } from "@core/session"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }

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

function StatusProbe({ timeoutMs, retryLabel = "Retry" }: Readonly<{ timeoutMs: number; retryLabel?: string }>) {
    const status = useSessionStatus({ timeoutMs })
    if (status.kind === "timed-out") {
        return (
            <div>
                <p>state: timed-out</p>
                <button type="button" onClick={status.retry}>
                    {retryLabel}
                </button>
            </div>
        )
    }
    if (status.kind === "ready") {
        return <p>state: ready:{status.userId}</p>
    }
    return <p>state: {status.kind}</p>
}

function renderProbe(options: { auth: ConvexAuthPhase; queryFails?: boolean; timeoutMs?: number }) {
    const client = createSeededClient(
        options.queryFails === true
            ? {
                  queryHook: () => {
                      throw new Error("denied")
                  },
              }
            : {},
    ).client
    const timeoutMs = options.timeoutMs ?? 60
    const view = (auth: ConvexAuthPhase) => (
        <ConvexProvider client={client} auth={auth}>
            <StatusProbe timeoutMs={timeoutMs} />
        </ConvexProvider>
    )
    const result = render(view(options.auth))
    return {
        setAuth: (auth: ConvexAuthPhase) => {
            result.rerender(view(auth))
        },
    }
}

async function waitPast(ms: number): Promise<void> {
    await act(async () => {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, ms)
        })
    })
}

const ALEX: TestUser = { id: "user-1", email: "alex@example.com", name: "Alex" }

function signIn(user: TestUser = ALEX): void {
    testUser = user
}

describe("useSessionStatus", () => {
    test("reports ready once Convex confirms auth", () => {
        signIn()
        renderProbe({ auth: "authenticated" })

        expect(screen.getByText("state: ready:user-1")).toBeInTheDocument()
    })

    test("reports timed-out when Convex rejects the session", async () => {
        signIn()
        renderProbe({ auth: "unauthenticated" })

        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })
        expect(screen.queryByText(/^state: ready/)).toBeNull()
    })

    test("retry re-arms the timeout window instead of reporting ready", async () => {
        signIn()
        renderProbe({ auth: "connecting", timeoutMs: 100 })

        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: "Retry" }))

        expect(screen.getByText("state: loading")).toBeInTheDocument()
        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })
    })

    test("holds an account switch until Convex re-confirms for the new user", async () => {
        signIn()
        const probe = renderProbe({ auth: "authenticated", timeoutMs: 500 })
        expect(screen.getByText("state: ready:user-1")).toBeInTheDocument()

        signIn({ id: "user-2", email: "sam@example.com", name: "Sam" })
        probe.setAuth("authenticated")
        expect(screen.getByText("state: loading")).toBeInTheDocument()
        await waitPast(50)
        expect(screen.queryByText(/^state: ready/)).toBeNull()

        probe.setAuth("connecting")
        expect(screen.getByText("state: loading")).toBeInTheDocument()

        probe.setAuth("authenticated")
        expect(screen.getByText("state: ready:user-2")).toBeInTheDocument()
        expect(screen.queryByText("state: ready:user-1")).toBeNull()
    })

    test("reports signed-out without arming a timeout when there is no user", async () => {
        testUser = null
        renderProbe({ auth: "unauthenticated" })

        expect(screen.getByText("state: signed-out")).toBeInTheDocument()
        await waitPast(100)
        expect(screen.getByText("state: signed-out")).toBeInTheDocument()
    })
})
