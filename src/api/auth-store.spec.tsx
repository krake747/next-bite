import { render, screen, waitFor } from "@testing-library/react"
import { act } from "@testing-library/react"
import { useEffect } from "react"
import { describe, expect, test, vi } from "vitest"

import { useAuthStore } from "./auth-store"

type Store = ReturnType<typeof useAuthStore>

type Deferred<T> = {
    readonly promise: Promise<T>
    readonly resolve: (value: T) => void
    readonly reject: (error: Error) => void
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (error: Error) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

type SessionResponse = {
    data: { user: { id: string; email: string; name: string; image: string | null } } | null
    error: { message: string } | null
}

let impls: Record<string, () => Promise<unknown>> = {}
let storeRef: Store | null = null

vi.mock("./auth-client", () => {
    return {
        authClient: {
            getSession: async () => impls["getSession"]?.(),
            signIn: {
                email: async () => impls["signInEmail"]?.(),
                social: async () => impls["signInSocial"]?.(),
                emailOtp: async () => impls["signInEmailOtp"]?.(),
            },
            signUp: {
                email: async () => impls["signUpEmail"]?.(),
            },
            emailOtp: {
                sendVerificationOtp: async () => impls["sendOtp"]?.(),
            },
            signOut: async () => impls["signOut"]?.(),
        },
    }
})

function Probe() {
    const store = useAuthStore()
    useEffect(() => {
        storeRef = store
    }, [store])
    return (
        <div>
            <p>auth:{String(store.isAuthenticated)}</p>
            <p>loading:{String(store.isLoading)}</p>
            <p>user:{store.user?.email ?? "none"}</p>
            <p>error:{store.error ?? "none"}</p>
        </div>
    )
}

const userA = { id: "u-a", email: "a@example.com", name: "A", image: null }
const userB = { id: "u-b", email: "b@example.com", name: "B", image: null }

function verifiedSession(email: string, id: string): SessionResponse {
    return { data: { user: { id, email, name: email, image: null } }, error: null }
}

function seedCache(email: string): void {
    localStorage.setItem("nb:session", JSON.stringify({ id: "cached", email, name: "Cached", image: null }))
}

function ignoreRejection(_error: unknown): void {
    // Mirrors production call sites, which swallow action rejections after the store
    // records them. Each test asserts the recorded state below instead.
}

function resetAuth(): void {
    localStorage.clear()
    impls = {}
    storeRef = null
}

function currentStore(): Store {
    if (storeRef === null) {
        throw new TypeError("Store not mounted")
    }
    return storeRef
}

async function startInitialize(): Promise<void> {
    await act(async () => {
        void currentStore().initializeAuth()
        await Promise.resolve()
    })
}

describe("auth lifecycle ownership", () => {
    test("deferred bootstrap cannot resurrect after sign-out", async () => {
        resetAuth()
        seedCache("a@example.com")
        const sessionGate = createDeferred<SessionResponse>()
        impls["getSession"] = async () => sessionGate.promise
        const signOutGate = createDeferred<unknown>()
        impls["signOut"] = async () => signOutGate.promise
        render(<Probe />)

        await startInitialize()
        expect(screen.getByText("loading:true")).toBeInTheDocument()

        const signOutPromise = currentStore().signOut()
        await act(async () => {
            signOutGate.resolve(undefined)
            await signOutPromise
        })
        expect(screen.getByText("auth:false")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()

        await act(async () => {
            sessionGate.resolve(verifiedSession("a@example.com", "u-a"))
            await Promise.resolve()
        })

        expect(screen.getByText("auth:false")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()
    })

    test("overlapping actions cannot clear each other pending state", async () => {
        resetAuth()
        const signInGate = createDeferred<unknown>()
        const otpGate = createDeferred<unknown>()
        impls["signInEmail"] = async () => signInGate.promise
        impls["sendOtp"] = async () => otpGate.promise
        render(<Probe />)

        await act(async () => {
            void currentStore().signInWithPassword("a@example.com", "password123").catch(ignoreRejection)
            await Promise.resolve()
        })
        await act(async () => {
            void currentStore().requestOtp("a@example.com").catch(ignoreRejection)
            await Promise.resolve()
        })
        expect(screen.getByText("loading:true")).toBeInTheDocument()

        await act(async () => {
            signInGate.resolve({ data: { user: userA }, error: null })
            await Promise.resolve()
        })

        expect(screen.getByText("loading:true")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()

        await act(async () => {
            otpGate.resolve({ data: null, error: null })
            await Promise.resolve()
        })
        expect(screen.getByText("loading:false")).toBeInTheDocument()
    })

    test("overlapping failures surface only the current action error", async () => {
        resetAuth()
        const signInGate = createDeferred<unknown>()
        const otpGate = createDeferred<unknown>()
        impls["signInEmail"] = async () => signInGate.promise
        impls["sendOtp"] = async () => otpGate.promise
        render(<Probe />)

        await act(async () => {
            void currentStore().signInWithPassword("a@example.com", "password123").catch(ignoreRejection)
            await Promise.resolve()
        })
        await act(async () => {
            void currentStore().requestOtp("a@example.com").catch(ignoreRejection)
            await Promise.resolve()
        })

        await act(async () => {
            signInGate.reject(new Error("stale failure"))
            await Promise.resolve()
        })

        expect(screen.getByText("loading:true")).toBeInTheDocument()
        expect(screen.getByText("error:none")).toBeInTheDocument()

        await act(async () => {
            otpGate.reject(new Error("Could not send code"))
            await Promise.resolve()
        })
        expect(screen.getByText("loading:false")).toBeInTheDocument()
        expect(screen.getByText("error:Could not send code")).toBeInTheDocument()
    })

    test("cache fallback is degraded display, not a verified session", async () => {
        resetAuth()
        seedCache("a@example.com")
        impls["getSession"] = async () => {
            await Promise.resolve()
            throw new Error("session unreachable")
        }
        render(<Probe />)

        await startInitialize()

        expect(screen.getByText("user:a@example.com")).toBeInTheDocument()
        expect(screen.getByText("auth:false")).toBeInTheDocument()
        expect(screen.getByText("loading:false")).toBeInTheDocument()
        expect(screen.getByText("error:session unreachable")).toBeInTheDocument()
    })

    test("successful revalidation authenticates", async () => {
        resetAuth()
        seedCache("a@example.com")
        impls["getSession"] = async () => {
            await Promise.resolve()
            return verifiedSession("a@example.com", "u-a")
        }
        render(<Probe />)

        await startInitialize()

        await waitFor(() => {
            expect(screen.getByText("auth:true")).toBeInTheDocument()
        })
        expect(screen.getByText("user:a@example.com")).toBeInTheDocument()
    })

    test("explicit signed-out response clears the cached identity", async () => {
        resetAuth()
        seedCache("a@example.com")
        impls["getSession"] = async () => {
            await Promise.resolve()
            return { data: null, error: null }
        }
        render(<Probe />)

        await startInitialize()

        expect(screen.getByText("auth:false")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()
        expect(screen.getByText("loading:false")).toBeInTheDocument()
        expect(localStorage.getItem("nb:session")).toBeNull()
    })

    test("sign-out clears error, user, and cache including rejection paths", async () => {
        resetAuth()
        seedCache("a@example.com")
        impls["signInEmail"] = async () => {
            await Promise.resolve()
            return { data: null, error: { message: "bad password" } }
        }
        const signOutGate = createDeferred<unknown>()
        impls["signOut"] = async () => signOutGate.promise
        render(<Probe />)

        await act(async () => {
            const ok = await currentStore().signInWithPassword("a@example.com", "wrongpass")
            expect(ok).toBe(false)
        })
        expect(screen.getByText("error:bad password")).toBeInTheDocument()

        const signOutPromise = currentStore().signOut()
        await act(async () => {
            signOutGate.reject(new Error("network down"))
            await expect(signOutPromise).rejects.toThrow("network down")
        })

        expect(screen.getByText("auth:false")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()
        expect(screen.getByText("error:none")).toBeInTheDocument()
        expect(localStorage.getItem("nb:session")).toBeNull()
    })

    test("late bootstrap cannot overwrite a replaced account", async () => {
        resetAuth()
        const sessionGate = createDeferred<SessionResponse>()
        impls["getSession"] = async () => sessionGate.promise
        const signInGate = createDeferred<SessionResponse>()
        impls["signInEmail"] = async () => signInGate.promise
        render(<Probe />)

        await startInitialize()
        await act(async () => {
            void currentStore().signInWithPassword("b@example.com", "password123").catch(ignoreRejection)
            await Promise.resolve()
        })

        await act(async () => {
            sessionGate.resolve(verifiedSession("a@example.com", "u-a"))
            await Promise.resolve()
        })
        expect(screen.getByText("loading:true")).toBeInTheDocument()
        expect(screen.getByText("user:none")).toBeInTheDocument()

        await act(async () => {
            signInGate.resolve({ data: { user: userB }, error: null })
            await Promise.resolve()
        })
        expect(screen.getByText("auth:true")).toBeInTheDocument()
        expect(screen.getByText("user:b@example.com")).toBeInTheDocument()
    })
})
