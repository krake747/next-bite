import { RouterProvider, createMemoryHistory, createRouter, type AnyRouter } from "@tanstack/react-router"
import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { useSyncExternalStore } from "react"
import { describe, expect, test, vi } from "vitest"

import { createAuthSnapshot } from "@api/auth.session"
import { ConvexProvider } from "@api/convex.context"
import { createSeededClient, seedKey } from "@api/db/seeded.client"

import { routeTree } from "../routeTree.gen"
import { renderDocument } from "../vitest.render"

type AuthSnapshot = {
    readonly isLoading: boolean
    readonly isInitializing: boolean
    readonly error: string | null
}

let authSnapshot: AuthSnapshot = { isLoading: false, isInitializing: false, error: null }
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
    publishAuth({ isLoading: true, isInitializing: false, error: null })
    pendingAuth = createDeferred()
    try {
        await pendingAuth.promise
    } catch (error) {
        publishAuth({
            isLoading: false,
            isInitializing: false,
            error: error instanceof Error ? error.message : fallbackMessage,
        })
        return false
    }
    publishAuth({ isLoading: false, isInitializing: false, error: null })
    return true
}

async function noop(): Promise<void> {
    await Promise.resolve()
}

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuthContext: () => {
            const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
            return {
                isAuthenticated: false,
                isLoading: snapshot.isLoading,
                isInitializing: snapshot.isInitializing,
                user: null,
                error: snapshot.error,
                initializeAuth: noop,
                signInWithPassword: noop,
                signUpWithPassword: noop,
                requestOtp: async (_email: string) => {
                    return fakeAuthStep("Could not send code")
                },
                verifyOtp: async (_email: string, _code: string) => {
                    const ok = await fakeAuthStep("Invalid code")
                    if (ok) {
                        // Mirror the real store, which persists the session
                        // before the page navigates: the _app beforeLoad
                        // redirects without this cached session.
                        localStorage.setItem(
                            "nb:session",
                            JSON.stringify({ id: "user-1", email: "alex@example.com", name: "Alex" }),
                        )
                    }
                    return ok
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
        emailOtp: true,
    })
}

async function mountAt(path: string): Promise<AnyRouter> {
    localStorage.removeItem("nb:session")
    const backend = createSeededClient({ seeds: querySeeds })
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
        context: { queryClient: backend.queryClient, authSnapshot: createAuthSnapshot() },
    })
    await router.load()
    renderDocument(
        <ConvexProvider client={backend.client} auth="authenticated">
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
        publishAuth({ isLoading: false, isInitializing: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        await sendCode("alex@example.com")
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeDisabled()
        })

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
        publishAuth({ isLoading: false, isInitializing: false, error: null })
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
        publishAuth({ isLoading: false, isInitializing: false, error: null })
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
            expect(router.state.location.pathname).toBe("/home")
        })
    })

    test("resets to email entry when choosing a different email", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, isInitializing: false, error: null })
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
        publishAuth({ isLoading: false, isInitializing: false, error: null })
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
            expect(router.state.location.pathname).toBe("/home")
        })
    })

    test("shows the loading placeholder during initial bootstrap", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: true, isInitializing: true, error: null })
        pendingAuth = null
        await mountAt("/login")

        expect(screen.queryByRole("button", { name: "Email me a code" })).toBeNull()
        expect(screen.queryByRole("button", { name: "Sign In" })).toBeNull()

        await act(async () => {
            publishAuth({ isLoading: false, isInitializing: false, error: null })
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
        })
    })

    test("keeps the form mounted with an inline spinner while a submit is pending", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, isInitializing: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        await sendCode("alex@example.com")

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Email me a code" })).toBeDisabled()
        })
        expect(screen.queryByRole("button", { name: "Sign In" })).toBeInTheDocument()

        await settlePendingAuth((deferred) => {
            deferred.resolve()
        })

        await waitFor(() => {
            expect(screen.getByText("Code sent to alex@example.com.")).toBeInTheDocument()
        })
    })

    test("keeps the password form intact", async () => {
        querySeeds.clear()
        seedAuthMethods()
        publishAuth({ isLoading: false, isInitializing: false, error: null })
        pendingAuth = null
        await renderAt("/login")

        expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Email me a code" })).toBeInTheDocument()
    })
})
