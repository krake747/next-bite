import { createSignal, createRoot } from "solid-js"
import { authClient } from "./auth-client"

type User = {
    id: string
    email: string
    name?: string | null | undefined
    image?: string | null | undefined
}

type SessionUser = {
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

const SESSION_KEY = "nb:session"

function isValidUser(value: unknown): value is User {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        typeof (value as Record<string, unknown>).id === "string" &&
        "email" in value &&
        typeof (value as Record<string, unknown>).email === "string"
    )
}

function saveSessionToStorage(user: User): void {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {
        return
    }
}

function getSessionFromStorage(): User | null {
    try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (!stored) return null
        const parsed = JSON.parse(stored) as unknown
        return isValidUser(parsed) ? parsed : null
    } catch {
        return null
    }
}

function clearSessionFromStorage(): void {
    try {
        localStorage.removeItem(SESSION_KEY)
    } catch {
        return
    }
}

function createAuthStore() {
    const [isAuthenticated, setIsAuthenticated] = createSignal(false)
    const [isLoading, setIsLoading] = createSignal(true)
    const [user, setUser] = createSignal<User | null>(null)
    const [error, setError] = createSignal<string | null>(null)

    const saveUser = (userData: User) => {
        setUser(userData)
        setIsAuthenticated(true)
        saveSessionToStorage(userData)
    }

    const clearUser = () => {
        setUser(null)
        setIsAuthenticated(false)
        clearSessionFromStorage()
    }

    const initializeAuth = async () => {
        setIsLoading(true)
        setError(null)

        const cachedUser = getSessionFromStorage()

        try {
            const result = await authClient.getSession()

            if (result.error) {
                if (cachedUser) {
                    setUser(cachedUser)
                    setIsAuthenticated(true)
                    return
                }
                throw new Error(result.error.message)
            }

            if (result.data?.user) {
                saveUser(mapSessionUserToUserPayload(result.data.user))
            } else {
                clearUser()
            }
        } catch {
            if (cachedUser) {
                setUser(cachedUser)
                setIsAuthenticated(true)
            } else {
                clearUser()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const signInWithPassword = async (email: string, password: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await authClient.signIn.email({ email, password })

            if (result.error) {
                const message = result.error.message ?? "Sign in failed"
                setError(message)
                throw new Error(message)
            }

            if (result.data?.user) {
                saveUser(mapSessionUserToUserPayload(result.data.user))
            } else {
                throw new Error("No user returned: email verification required")
            }
        } catch (err) {
            if (!error()) {
                const message = err instanceof Error ? err.message : "Sign in failed"
                setError(message)
            }
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const signUpWithPassword = async (name: string, email: string, password: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await authClient.signUp.email({ name, email, password })

            if (result.error) {
                const message = result.error.message ?? "Sign up failed"
                setError(message)
                throw new Error(message)
            }

            if (result.data?.user) {
                saveUser(mapSessionUserToUserPayload(result.data.user))
            } else {
                throw new Error("No user returned: email verification required")
            }
        } catch (err) {
            if (!error()) {
                const message = err instanceof Error ? err.message : "Sign up failed"
                setError(message)
            }
            throw err
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
        error,
        initializeAuth,
        signInWithPassword,
        signUpWithPassword,
        signOut,
    }
}

export const authStore = createRoot(createAuthStore)
