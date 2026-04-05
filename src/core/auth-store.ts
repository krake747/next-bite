import { createSignal, createRoot } from "solid-js"
import { authClient } from "./auth-client"

export type User = {
    id: string
    email: string
    name?: string | null | undefined
    image?: string | null | undefined
}

function mapSessionUserToUserPayload(user: SessionUser): User {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
    }
}

type SessionUser = {
    id: string
    email: string
    name?: string | null | undefined
    image?: string | null | undefined
}

function createAuthStore() {
    const [isAuthenticated, setIsAuthenticated] = createSignal(false)
    const [isLoading, setIsLoading] = createSignal(true)
    const [user, setUser] = createSignal<User | null>(null)

    const saveUser = (userData: User) => {
        setUser(userData)
        setIsAuthenticated(true)
    }

    const clearUser = () => {
        setUser(null)
        setIsAuthenticated(false)
    }

    const initializeAuth = async () => {
        setIsLoading(true)

        try {
            const { data: session } = await authClient.getSession()

            if (session?.user) {
                saveUser(mapSessionUserToUserPayload(session.user))
            } else {
                clearUser()
            }
        } catch {
            clearUser()
        } finally {
            setIsLoading(false)
        }
    }

    const signInWithPassword = async (email: string, password: string) => {
        setIsLoading(true)

        try {
            const result = await authClient.signIn.email({ email, password })

            if (result.error) {
                throw new Error(result.error.message)
            }

            if (result.data?.user) {
                saveUser(mapSessionUserToUserPayload(result.data.user))
            } else {
                throw new Error("No user returned: email verification required")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const signUpWithPassword = async (name: string, email: string, password: string) => {
        setIsLoading(true)

        try {
            const result = await authClient.signUp.email({ name, email, password })

            if (result.error) {
                throw new Error(result.error.message)
            }

            if (result.data?.user) {
                saveUser(mapSessionUserToUserPayload(result.data.user))
            } else {
                throw new Error("No user returned: email verification required")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async () => {
        setIsLoading(true)

        try {
            await authClient.signOut()
        } finally {
            clearUser()
            setIsLoading(false)
        }
    }

    return {
        isAuthenticated,
        isLoading,
        user,
        initializeAuth,
        signInWithPassword,
        signUpWithPassword,
        signOut,
    }
}

export const authStore = createRoot(createAuthStore)
