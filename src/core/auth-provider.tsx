import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { ConvexClient } from "convex/browser"
import { ConvexProvider } from "./convex-solid.tsx"
import { useAuthStore } from "./auth-store"
import { LoadingPlaceholder } from "@ui/loading"

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

type AuthStore = ReturnType<typeof useAuthStore>

const AuthContext = createContext<AuthStore | null>(null)

function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return ctx
}

function AuthProvider({ children }: { children: ReactNode }) {
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
