import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { ConvexReactClient, useConvexAuth } from "convex/react"
import { useState, useEffect, createContext, use } from "react"

import { ConvexProvider, type ConvexAuthPhase } from "@api/convex.context"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { env } from "@core/env"

import { authClient } from "./auth.sdk"
import { useAuthStore } from "./auth.store"

type AuthStore = ReturnType<typeof useAuthStore>

const AuthContext = createContext<AuthStore | null>(null)

async function noopServerAuthStep(): Promise<void> {
    await Promise.resolve()
}

async function noopServerAuthResult(): Promise<boolean> {
    await Promise.resolve()
    return false
}

const serverAuthStore: AuthStore = {
    // Auth-unknown: the server has no session, so it renders the same loading variant as the
    // client's first render. Matching first renders keeps hydration clean; resolved auth state
    // arrives as a normal post-hydration update.
    isAuthenticated: false,
    isLoading: true,
    isInitializing: true,
    user: null,
    error: null,
    initializeAuth: noopServerAuthStep,
    signInWithPassword: noopServerAuthResult,
    signUpWithPassword: noopServerAuthResult,
    requestOtp: noopServerAuthResult,
    verifyOtp: noopServerAuthResult,
    signOut: noopServerAuthStep,
}

export function useAuthContext() {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return ctx
}

type ConvexPair = {
    readonly client: ConvexReactClient
    readonly convexQueryClient: ConvexQueryClient
}

function toConvexAuthPhase(state: Readonly<{ isLoading: boolean; isAuthenticated: boolean }>): ConvexAuthPhase {
    if (state.isLoading) {
        return "connecting"
    }
    return state.isAuthenticated ? "authenticated" : "unauthenticated"
}

function ConvexAuthBridge({ client, children }: Readonly<{ client: ConvexReactClient; children: React.ReactNode }>) {
    const phase = toConvexAuthPhase(useConvexAuth())
    return (
        <ConvexProvider client={client} auth={phase}>
            {children}
        </ConvexProvider>
    )
}

const connectedQueryClients = new WeakMap<QueryClient, ConvexPair>()
const liveQueryClients = new WeakSet<QueryClient>()

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const queryClient = useQueryClient()
    const [pair] = useState<ConvexPair | null>(() => {
        if (typeof window === "undefined") {
            return null
        }
        const hit = connectedQueryClients.get(queryClient)
        if (hit !== undefined) {
            return hit
        }
        const client = new ConvexReactClient(env.VITE_CONVEX_URL)
        const convexQueryClient = new ConvexQueryClient(client)
        const created = { client, convexQueryClient }
        connectedQueryClients.set(queryClient, created)
        return created
    })
    const store = useAuthStore()

    useEffect(() => {
        if (pair !== null && !liveQueryClients.has(queryClient)) {
            queryClient.setDefaultOptions({
                queries: {
                    queryKeyHashFn: pair.convexQueryClient.hashFn(),
                    queryFn: pair.convexQueryClient.queryFn(),
                },
            })
            pair.convexQueryClient.connect(queryClient)
            liveQueryClients.add(queryClient)
        }
        void store.initializeAuth()
    }, [pair, queryClient])

    if (pair === null) {
        return <AuthContext.Provider value={serverAuthStore}>{children}</AuthContext.Provider>
    }

    return (
        <ConvexBetterAuthProvider client={pair.client} authClient={authClient}>
            <ConvexAuthBridge client={pair.client}>
                <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
            </ConvexAuthBridge>
        </ConvexBetterAuthProvider>
    )
}
