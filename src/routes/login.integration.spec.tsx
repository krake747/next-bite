import { RouterProvider, createMemoryHistory, createRouter, type AnyRouter } from "@tanstack/react-router"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useSyncExternalStore } from "react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex-client"
import { createSeededClient, seedKey } from "@core/db/seeded-client"

import { routeTree } from "../routeTree.gen"

type AuthSnapshot = {
    readonly isLoading: boolean
    readonly error: string | null
}

let authSnapshot: AuthSnapshot = { isLoading: false, error: null }
const authListeners = new Set<() => void>()

function subscribeAuth(listener: () => void): () => void {
    authListeners.add(listener)
    return () => {
        authListeners.delete(listener)
    }
}

function getAuthSnapshot(): AuthSnapshot {
    return authSnapshot
}

function publishAuth(next: AuthSnapshot): void {
    authSnapshot = next
    for (const listener of authListeners) {
        listener()
    }
}

type Deferred = {
    readonly promise: Promise<void>
    readonly resolve: () => void
    readonly reject: (error: Error) => void
}

let pendingAuth: Deferred | null = null

function createDeferred(): Deferred {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

async function fakeAuthStep(fallbackMessage: string): Promise<boolean> {
    publishAuth({ isLoading: true, error: null })
    pendingAuth = createDeferred()
    try {
        await pendingAuth.promise
    } catch (error) {
        publishAuth({ isLoading: false, error: error instanceof Error ? error.message : fallbackMessage })
        return false
    }
    publishAuth({ isLoading: false, error: null })
    return true
}

async function noop(): Promise<void> {
    await Promise.resolve()
}

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

vi.mock("@core/auth-provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/auth-provider")>()
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuth: () => {
            const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
            return {
                isAuthenticated: false,
                isLoading: snapshot.isLoading,
                user: null,
                error: snapshot.error,
                initializeAuth: noop,
                signInWithPassword: noop,
                signUpWithPassword: noop,
                signInWithSocial: noop,
                requestOtp: async (_email: string) => {
                    return fakeAuthStep("Could not send code")
                },
                verifyOtp: async (_email: string, _code: string) => {
                    return fakeAuthStep("Invalid code")
                },
                signOut: noop,
            }
        },
    }
})

const querySeeds = new Map<string, unknown>()

function seedAuthMethods(): void {
    querySeeds.set(seedKey("auth:getAuthMethods", undefined), {
        password: true,
        google: false,
        github: false,
        emailOtp: true,
    })
}

async function mountAt(path: string): Promise<AnyRouter> {
    const backend = createSeededClient({ seeds: querySeeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient },
    })
    await router.load()
    render(
        <ConvexProvider client={backend.client}>
            <RouterProvider router={router} />
        </ConvexProvider>,
    )
    return router
}

async function renderAt(path: string): Promise<AnyRouter> {
    const router = await mountAt(path)
    await waitFor(() => {
        expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
    })
    return router
}

function otpEmailInput(): HTMLInputElement {
    const sendButton = screen.getByRole("button", { name: "Email me a code" })
    const form = sendButton.closest("form")
    const input = form?.querySelector('input[type="email"]')
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("OTP email input not found")
    }
    return input
}

async function waitForPendingAuth(): Promise<Deferred> {
    await waitFor(() => {
        expect(pendingAuth).not.toBeNull()
    })
    if (pendingAuth === null) {
        throw new Error("Auth request never started")
    }
    return pendingAuth
}

async function settlePendingAuth(settle: (deferred: Deferred) => void): Promise<void> {
    const deferred = await waitForPendingAuth()
    await act(async () => {
        settle(deferred)
        await Promise.resolve()
    })
}

async function sendCode(email: string): Promise<void> {
    fireEvent.change(otpEmailInput(), { target: { value: email } })
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }))
    await waitForPendingAuth()
}

describe("login OTP step", () => {
    test("stays on code entry for the same email after a deferred send resolves", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        await sendCode("alex@example.com")
        expect(screen.queryByRole("button", { name: "Email me a code" })).toBeNull()

        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })

        await waitFor(() => {
            expect(screen.getByText("Code sent to alex@example.com.")).toBeInTheDocument()
        })
        expect(screen.getByRole("button", { name: "Verify code" })).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Email me a code" })).toBeNull()
    })

    test("stays on email entry with an error when send fails", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        await sendCode("alex@example.com")
        await settlePendingAuth((deferred) => {
            deferred.reject(new Error("Could not send code"))
        })

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
        })
        expect(screen.getByText("Could not send code")).toBeInTheDocument()

        await sendCode("alex@example.com")
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })

        await waitFor(() => {
            expect(screen.getByText("Code sent to alex@example.com.")).toBeInTheDocument()
        })
    })

    test("stays on code entry with an error when verify fails", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        const router = await renderAt("/login")

        await sendCode("alex@example.com")
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Verify code" })).toBeInTheDocument()
        })

        fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify code" }))
        await settlePendingAuth((deferred) => {
            deferred.reject(new Error("Invalid code"))
        })

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Verify code" })).toBeInTheDocument()
        })
        expect(screen.getByText("Code sent to alex@example.com.")).toBeInTheDocument()
        expect(screen.getByText("Invalid code")).toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify code" }))
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/")
        })
    })

    test("resets to email entry when choosing a different email", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        await sendCode("alex@example.com")
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Verify code" })).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole("button", { name: "Use a different email" }))

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
        })
    })

    test("navigates home once after a successful verify", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        const router = await renderAt("/login")

        await sendCode("alex@example.com")
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Verify code" })).toBeInTheDocument()
        })

        fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify code" }))
        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/")
        })
    })

    test("shows the loading placeholder during initial bootstrap", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: true, error: null })
        pendingAuth = null
        await mountAt("/login")

        expect(screen.queryByRole("button", { name: "Email me a code" })).toBeNull()
        expect(screen.queryByRole("button", { name: "Sign In" })).toBeNull()

        await act(async () => {
            publishAuth({ isLoading: false, error: null })
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
        })
    })

    test("keeps the password form intact", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
    })
})
