import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex-client"
import { createSeededClient } from "@api/db/seeded-client"
import { useSessionStatus } from "@core/session"

type TestUser = { id: string; email: string; name: string }

let testUser: TestUser | null = { id: "user-1", email: "alex@example.com", name: "Alex" }
let tokenValue: string | null = "test-token"
let tokenGate: { promise: Promise<void>; resolve: () => void } | null = null

const getTokenMock = vi.fn<() => Promise<string | null>>(async () => {
    if (tokenGate !== null) {
        await tokenGate.promise
    }
    return tokenValue
})

vi.mock("@api/auth-client", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth-client")>()
    return {
        ...original,
        getConvexSessionToken: async () => getTokenMock(),
    }
})

vi.mock("@api/auth-provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth-provider")>()
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

function renderProbe(options?: { queryFails?: boolean; timeoutMs?: number }): void {
    const client = createSeededClient(
        options?.queryFails === true
            ? {
                  queryHook: () => {
                      throw new Error("denied")
                  },
              }
            : {},
    ).client
    render(
        <ConvexProvider client={client}>
            <StatusProbe timeoutMs={options?.timeoutMs ?? 60} />
        </ConvexProvider>,
    )
}

function resetAuth(): void {
    testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
    tokenValue = "test-token"
    tokenGate = null
    getTokenMock.mockClear()
}

describe("useSessionStatus", () => {
    test("reports ready when the probe succeeds", async () => {
        resetAuth()
        renderProbe()

        await waitFor(() => {
            expect(screen.getByText("state: ready:user-1")).toBeInTheDocument()
        })
    })

    test("reports timed-out instead of ready when the token is missing", async () => {
        resetAuth()
        tokenValue = null
        renderProbe()

        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
        expect(screen.queryByText(/^state: ready/)).toBeNull()
    })

    test("reports timed-out when the probe is rejected", async () => {
        resetAuth()
        renderProbe({ queryFails: true })

        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })
        expect(screen.queryByText(/^state: ready/)).toBeNull()
    })

    test("recovers to ready after retry when the token starts working", async () => {
        resetAuth()
        tokenValue = null
        renderProbe()

        await waitFor(() => {
            expect(screen.getByText("state: timed-out")).toBeInTheDocument()
        })

        tokenValue = "test-token"
        fireEvent.click(screen.getByRole("button", { name: "Retry" }))

        await waitFor(() => {
            expect(screen.getByText("state: ready:user-1")).toBeInTheDocument()
        })
    })

    test("retry re-arms every mounted session gate", async () => {
        resetAuth()
        tokenValue = null
        const client = createSeededClient({}).client
        render(
            <ConvexProvider client={client}>
                <StatusProbe timeoutMs={60} retryLabel="Retry first" />
            </ConvexProvider>,
        )
        render(
            <ConvexProvider client={client}>
                <StatusProbe timeoutMs={60} retryLabel="Retry second" />
            </ConvexProvider>,
        )

        await waitFor(() => {
            expect(screen.getAllByText("state: timed-out")).toHaveLength(2)
        })

        tokenValue = "test-token"
        fireEvent.click(screen.getByRole("button", { name: "Retry first" }))

        await waitFor(() => {
            expect(screen.getAllByText("state: ready:user-1")).toHaveLength(2)
        })
    })

    test("stays loading through an account switch until the new probe resolves", async () => {
        resetAuth()
        let releaseGate!: () => void
        tokenGate = {
            promise: new Promise<void>((resolve) => {
                releaseGate = resolve
            }),
            resolve: () => {
                releaseGate()
            },
        }
        const { rerender } = render(
            <ConvexProvider client={createSeededClient({}).client}>
                <StatusProbe timeoutMs={60} />
            </ConvexProvider>,
        )

        testUser = { id: "user-2", email: "sam@example.com", name: "Sam" }
        rerender(
            <ConvexProvider client={createSeededClient({}).client}>
                <StatusProbe timeoutMs={60} />
            </ConvexProvider>,
        )
        expect(screen.getByText("state: loading")).toBeInTheDocument()

        tokenGate.resolve()
        tokenGate = null

        await waitFor(() => {
            expect(screen.getByText("state: ready:user-2")).toBeInTheDocument()
        })
        expect(screen.queryByText("state: ready:user-1")).toBeNull()
    })

    test("reports signed-out without probing when there is no user", async () => {
        resetAuth()
        testUser = null
        let releaseGate!: () => void
        tokenGate = {
            promise: new Promise<void>((resolve) => {
                releaseGate = resolve
            }),
            resolve: () => {
                releaseGate()
            },
        }
        renderProbe()

        expect(screen.getByText("state: signed-out")).toBeInTheDocument()
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 50)
        })
        expect(getTokenMock).not.toHaveBeenCalled()
        tokenGate.resolve()
        tokenGate = null
    })
})
