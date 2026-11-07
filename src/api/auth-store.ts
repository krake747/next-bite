import { useReducer, useRef } from "react"
import * as v from "valibot"

import { authClient } from "./auth-client"

type User = {
    readonly id: string
    readonly email: string
    readonly name?: string | null | undefined
    readonly image?: string | null | undefined
}

type SessionUser = {
    readonly id: string
    readonly email: string
    readonly name?: string | null | undefined
    readonly image?: string | null | undefined
}

function mapSessionUserToUserPayload(user: Readonly<SessionUser>): User {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
    }
}

const SESSION_KEY = "nb:session"

const sessionUserSchema = v.object({
    id: v.string(),
    email: v.string(),
    name: v.optional(v.nullable(v.string())),
    image: v.optional(v.nullable(v.string())),
})

function isValidUser(value: unknown): value is User {
    return v.is(sessionUserSchema, value)
}

function saveSessionToStorage(user: Readonly<User>): void {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {
        return
    }
}

function getSessionFromStorage(): User | null {
    try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (stored === null || stored === "") {
            return null
        }
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

export function hasCachedSession(): boolean {
    try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (stored === null || stored === "") {
            return false
        }
        return isValidUser(JSON.parse(stored) as unknown)
    } catch {
        return false
    }
}

type AuthState = {
    readonly isAuthenticated: boolean
    readonly isLoading: boolean
    readonly user: User | null
    readonly error: string | null
}

type AuthAction =
    | { readonly type: "SET_LOADING"; readonly isLoading: boolean }
    | { readonly type: "SET_USER"; readonly user: User }
    | { readonly type: "SET_CACHED_USER"; readonly user: User }
    | { readonly type: "CLEAR_USER" }
    | { readonly type: "SET_ERROR"; readonly error: string | null }

function authReducer(state: Readonly<AuthState>, action: Readonly<AuthAction>): AuthState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.isLoading }
        case "SET_USER":
            return { ...state, user: action.user, isAuthenticated: true, error: null }
        case "SET_CACHED_USER":
            // Degraded display identity: the user sees their remembered email, but nothing
            // treats this as a verified session. Backend authorization stays authoritative.
            return { ...state, user: action.user, isAuthenticated: false, error: null }
        case "CLEAR_USER":
            return { ...state, user: null, isAuthenticated: false }
        case "SET_ERROR":
            return { ...state, error: action.error }
        default: {
            const _exhaustive: never = action
            return _exhaustive
        }
    }
}

type BootstrapOutcome =
    | { kind: "verified"; user: User }
    | { kind: "degraded"; user: User; message: string }
    | { kind: "clear" }

function lookupFailureMessage(error: unknown): string {
    if (error instanceof Error && error.message !== "") {
        return error.message
    }
    return "Session lookup failed"
}

async function lookupSession(cachedUser: User | null): Promise<BootstrapOutcome> {
    const settled = await authClient.getSession().then(
        (result) => ({ ok: true as const, result }),
        (error: unknown) => ({ ok: false as const, error }),
    )
    if (!settled.ok) {
        if (cachedUser === null) {
            return { kind: "clear" }
        }
        return { kind: "degraded", user: cachedUser, message: lookupFailureMessage(settled.error) }
    }
    if (settled.result.error) {
        if (cachedUser === null) {
            return { kind: "clear" }
        }
        return { kind: "degraded", user: cachedUser, message: lookupFailureMessage(settled.result.error) }
    }
    const user = settled.result.data?.user
    if (user === undefined || user === null) {
        return { kind: "clear" }
    }
    return { kind: "verified", user: mapSessionUserToUserPayload(user) }
}

export function useAuthStore() {
    const [state, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: null,
    })
    // Operation generation: every auth operation claims the current generation when it
    // starts. A completion, error, or reset only lands when its generation is still
    // current. Conflicting actions are superseded: the last starter owns pending state,
    // errors, and loading. Sign-out bumps the generation so late bootstrap or sign-in
    // results can never resurrect a signed-out or replaced account.
    const generationRef = useRef(0)

    const currentGeneration = (): number => generationRef.current

    const claimGeneration = (): number => {
        generationRef.current += 1
        return generationRef.current
    }

    const saveUser = (userData: Readonly<User>) => {
        dispatch({ type: "SET_USER", user: userData })
        saveSessionToStorage(userData)
    }

    const clearUser = () => {
        dispatch({ type: "CLEAR_USER" })
        clearSessionFromStorage()
    }

    const saveUserIfCurrent = (userData: Readonly<User>, generation: number) => {
        if (generation === currentGeneration()) {
            saveUser(userData)
        }
    }

    async function runAuthStep(
        fallbackMessage: string,
        attempt: (generation: number) => Promise<void>,
    ): Promise<boolean> {
        const generation = claimGeneration()
        dispatch({ type: "SET_LOADING", isLoading: true })
        dispatch({ type: "SET_ERROR", error: null })
        try {
            await attempt(generation)
        } catch (err) {
            if (generation === currentGeneration()) {
                dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : fallbackMessage })
            }
            return false
        } finally {
            if (generation === currentGeneration()) {
                dispatch({ type: "SET_LOADING", isLoading: false })
            }
        }
        return true
    }

    function throwAuthError(message: string | undefined, fallbackMessage: string): never {
        throw new Error(message ?? fallbackMessage)
    }

    const initializeAuth = async () => {
        const generation = claimGeneration()
        dispatch({ type: "SET_LOADING", isLoading: true })
        dispatch({ type: "SET_ERROR", error: null })

        const outcome = await lookupSession(getSessionFromStorage())
        if (generation !== currentGeneration()) {
            return
        }
        if (outcome.kind === "verified") {
            saveUser(outcome.user)
        } else if (outcome.kind === "degraded") {
            dispatch({ type: "SET_CACHED_USER", user: outcome.user })
            dispatch({ type: "SET_ERROR", error: outcome.message })
        } else {
            clearUser()
        }
        if (generation === currentGeneration()) {
            dispatch({ type: "SET_LOADING", isLoading: false })
        }
    }

    const authenticateWithPassword = async (
        action: "signIn" | "signUp",
        credentials: Readonly<{ name?: string | undefined; email: string; password: string }>,
    ): Promise<boolean> => {
        const fallbackMessage = action === "signIn" ? "Sign in failed" : "Sign up failed"
        return runAuthStep(fallbackMessage, async (generation) => {
            const result =
                action === "signIn"
                    ? await authClient.signIn.email({ email: credentials.email, password: credentials.password })
                    : await authClient.signUp.email({
                          name: credentials.name ?? "",
                          email: credentials.email,
                          password: credentials.password,
                      })

            if (result.error) {
                throwAuthError(result.error.message, fallbackMessage)
            }

            if (result.data?.user !== undefined && result.data?.user !== null) {
                saveUserIfCurrent(mapSessionUserToUserPayload(result.data.user), generation)
            } else {
                throw new Error("No user returned: email verification required")
            }
        })
    }

    const signInWithPassword = async (email: string, password: string): Promise<boolean> => {
        return authenticateWithPassword("signIn", { email, password })
    }

    const signUpWithPassword = async (name: string, email: string, password: string): Promise<boolean> => {
        return authenticateWithPassword("signUp", { name, email, password })
    }

    const signInWithSocial = async (provider: "google" | "github", redirect?: string): Promise<boolean> => {
        return runAuthStep("Social sign in failed", async () => {
            const safeRedirect =
                redirect !== undefined && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/"
            const result = await authClient.signIn.social({ provider, callbackURL: safeRedirect })
            if (result.error) {
                throwAuthError(result.error.message, "Social sign in failed")
            }
        })
    }

    const requestOtp = async (email: string): Promise<boolean> => {
        return runAuthStep("Could not send code", async () => {
            const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
            if (result.error) {
                throwAuthError(result.error.message, "Could not send code")
            }
        })
    }

    const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
        return runAuthStep("Invalid code", async (generation) => {
            const result = await authClient.signIn.emailOtp({ email, otp })
            if (result.error) {
                throwAuthError(result.error.message, "Invalid code")
            }
            if (result.data?.user !== undefined && result.data?.user !== null) {
                saveUserIfCurrent(mapSessionUserToUserPayload(result.data.user), generation)
            } else {
                throw new Error("No user returned: email verification required")
            }
        })
    }

    const signOut = async () => {
        const generation = claimGeneration()
        dispatch({ type: "SET_ERROR", error: null })
        dispatch({ type: "SET_LOADING", isLoading: true })

        try {
            await authClient.signOut()
        } finally {
            if (generation === currentGeneration()) {
                clearUser()
                dispatch({ type: "SET_LOADING", isLoading: false })
            }
        }
    }

    return {
        ...state,
        initializeAuth,
        signInWithPassword,
        signUpWithPassword,
        signInWithSocial,
        requestOtp,
        verifyOtp,
        signOut,
    }
}
