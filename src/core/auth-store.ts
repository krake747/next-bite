import { createSignal, createRoot } from "solid-js"
import { authClient } from "./auth-client"

const USER_KEY = "nb:better_auth_user"

export type User = {
    id: string
    email: string
    name: string | null | undefined
    image: string | null | undefined
}

function createAuthStore() {
    const [isAuthenticated, setIsAuthenticated] = createSignal(false)
    const [isLoading, setIsLoading] = createSignal(true)
    const [user, setUser] = createSignal<User | null>(null)

    const saveUser = (userData: User) => {
        sessionStorage.setItem(USER_KEY, JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
    }

    const clearUser = () => {
        sessionStorage.removeItem(USER_KEY)
        setUser(null)
        setIsAuthenticated(false)
    }

    const initializeAuth = async () => {
        setIsLoading(true)
        try {
            const { data: session } = await authClient.getSession()

            if (session?.user) {
                saveUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                    image: session.user.image,
                })
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
                saveUser({
                    id: result.data.user.id,
                    email: result.data.user.email,
                    name: result.data.user.name,
                    image: result.data.user.image,
                })
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
                saveUser({
                    id: result.data.user.id,
                    email: result.data.user.email,
                    name: result.data.user.name,
                    image: result.data.user.image,
                })
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
