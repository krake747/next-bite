import { useReducer, useCallback } from "react"
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

type AuthState = {
    isAuthenticated: boolean
    isLoading: boolean
    user: User | null
    error: string | null
}

type AuthAction =
    | { type: "SET_LOADING"; isLoading: boolean }
    | { type: "SET_USER"; user: User }
    | { type: "CLEAR_USER" }
    | { type: "SET_ERROR"; error: string | null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.isLoading }
        case "SET_USER":
            return { ...state, user: action.user, isAuthenticated: true, error: null }
        case "CLEAR_USER":
            return { ...state, user: null, isAuthenticated: false }
        case "SET_ERROR":
            return { ...state, error: action.error }
    }
}

function useAuthStore() {
    const [state, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: null,
    })

    const saveUser = useCallback((userData: User) => {
        dispatch({ type: "SET_USER", user: userData })
        saveSessionToStorage(userData)
    }, [])

    const clearUser = useCallback(() => {
        dispatch({ type: "CLEAR_USER" })
        clearSessionFromStorage()
    }, [])

    const initializeAuth = useCallback(async () => {
        dispatch({ type: "SET_LOADING", isLoading: true })
        dispatch({ type: "SET_ERROR", error: null })

        const cachedUser = getSessionFromStorage()

        try {
            const result = await authClient.getSession()

            if (result.error) {
                if (cachedUser) {
                    dispatch({ type: "SET_USER", user: cachedUser })
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
                dispatch({ type: "SET_USER", user: cachedUser })
            } else {
                clearUser()
            }
        } finally {
            dispatch({ type: "SET_LOADING", isLoading: false })
        }
    }, [saveUser, clearUser])

    const signInWithPassword = useCallback(
        async (email: string, password: string) => {
            dispatch({ type: "SET_LOADING", isLoading: true })
            dispatch({ type: "SET_ERROR", error: null })

            try {
                const result = await authClient.signIn.email({ email, password })

                if (result.error) {
                    const message = result.error.message ?? "Sign in failed"
                    dispatch({ type: "SET_ERROR", error: message })
                    throw new Error(message)
                }

                if (result.data?.user) {
                    saveUser(mapSessionUserToUserPayload(result.data.user))
                } else {
                    throw new Error("No user returned: email verification required")
                }
            } catch (err) {
                if (!state.error) {
                    const message = err instanceof Error ? err.message : "Sign in failed"
                    dispatch({ type: "SET_ERROR", error: message })
                }
                throw err
            } finally {
                dispatch({ type: "SET_LOADING", isLoading: false })
            }
        },
        [state.error, saveUser],
    )

    const signUpWithPassword = useCallback(
        async (name: string, email: string, password: string) => {
            dispatch({ type: "SET_LOADING", isLoading: true })
            dispatch({ type: "SET_ERROR", error: null })

            try {
                const result = await authClient.signUp.email({ name, email, password })

                if (result.error) {
                    const message = result.error.message ?? "Sign up failed"
                    dispatch({ type: "SET_ERROR", error: message })
                    throw new Error(message)
                }

                if (result.data?.user) {
                    saveUser(mapSessionUserToUserPayload(result.data.user))
                } else {
                    throw new Error("No user returned: email verification required")
                }
            } catch (err) {
                if (!state.error) {
                    const message = err instanceof Error ? err.message : "Sign up failed"
                    dispatch({ type: "SET_ERROR", error: message })
                }
                throw err
            } finally {
                dispatch({ type: "SET_LOADING", isLoading: false })
            }
        },
        [state.error, saveUser],
    )

    const signOut = useCallback(async () => {
        dispatch({ type: "SET_LOADING", isLoading: true })

        try {
            await authClient.signOut()
        } finally {
            clearUser()
            dispatch({ type: "SET_LOADING", isLoading: false })
        }
    }, [clearUser])

    return {
        ...state,
        initializeAuth,
        signInWithPassword,
        signUpWithPassword,
        signOut,
    }
}

export { useAuthStore }
