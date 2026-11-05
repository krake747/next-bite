import { ConvexClient, type AuthTokenFetcher } from "convex/browser"
import { useState, useEffect, createContext, useContext } from "react"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { LoadingPlaceholder } from "@ui/loading"

import { authClient } from "./auth-client"
import { useAuthStore } from "./auth-store"
import { ConvexProvider } from "./convex-client.tsx"
import { env } from "./env"

type AuthStore = ReturnType<typeof useAuthStore>

const AuthContext = createContext<AuthStore | null>(null)

function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return ctx
}

function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [pair] = useState(() => {
        if (typeof window === "undefined") {
            return null
        }
        const client = new ConvexClient(env.VITE_CONVEX_URL)
        return {
            client,
            authed: {
                setAuth: (fetchToken: AuthTokenFetcher) => {
                    client.setAuth(fetchToken)
                },
                clearAuth: () => {
                    client.setAuth(async () => {
                        await Promise.resolve()
                        return null
                    })
                },
            },
        }
    })
    const [isInitialized, setIsInitialized] = useState(false)
    const store = useAuthStore()

    useEffect(() => {
        void store.initializeAuth().then(() => {
            setIsInitialized(true)
        })
    }, [])

    if (!isInitialized || pair === null) {
        return <LoadingPlaceholder />
    }

    return (
        <ConvexBetterAuthProvider client={pair.authed} authClient={authClient}>
            <ConvexProvider client={pair.client}>
                <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
            </ConvexProvider>
        </ConvexBetterAuthProvider>
    )
}

export { AuthProvider, useAuth }
