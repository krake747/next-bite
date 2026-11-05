import { ConvexClient } from "convex/browser"
import { useState, useEffect, createContext, useContext } from "react"

import { LoadingPlaceholder } from "@ui/loading"

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
    const [convex] = useState<ConvexClient | null>(() =>
        typeof window === "undefined" ? null : new ConvexClient(env.VITE_CONVEX_URL),
    )
    const [isInitialized, setIsInitialized] = useState(false)
    const store = useAuthStore()

    useEffect(() => {
        void store.initializeAuth().then(() => {
            setIsInitialized(true)
        })
    }, [])

    if (!isInitialized) {
        return <LoadingPlaceholder />
    }

    return (
        <ConvexProvider client={convex}>
            <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
        </ConvexProvider>
    )
}

export { AuthProvider, useAuth }
