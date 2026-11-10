import { useReducer, useRef } from "react"
import * as v from "valibot"

import { type RouterAuth, type SessionUser, signedOutAuth } from "./auth.identity"
import { authClient } from "./auth.sdk"

type User = SessionUser

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

type AuthState = {
    readonly isAuthenticated: boolean
    readonly isLoading: boolean
    readonly isInitializing: boolean
    readonly user: User | null
    readonly error: string | null
}

type AuthAction =
    | { readonly type: "SET_LOADING"; readonly isLoading: boolean }
    | { readonly type: "SET_INITIALIZING"; readonly isInitializing: boolean }
    | { readonly type: "SET_USER"; readonly user: User }
    | { readonly type: "SET_CACHED_USER"; readonly user: User }
    | { readonly type: "CLEAR_USER" }
    | { readonly type: "SET_ERROR"; readonly error: string | null }

function authReducer(state: Readonly<AuthState>, action: Readonly<AuthAction>): AuthState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.isLoading }
        case "SET_INITIALIZING":
            return { ...state, isInitializing: action.isInitializing }
        case "SET_USER":
            return { ...state, user: action.user, isAuthenticated: true, error: null }
        case "SET_CACHED_USER":
            // See ADR-0025: degraded identity grants nothing.
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

function initialAuthState(initial: RouterAuth | null): AuthState {
    if (initial === null) {
        return { isAuthenticated: false, isLoading: true, isInitializing: true, user: null, error: null }
    }
    return {
        isAuthenticated: initial.isAuthenticated,
        isLoading: false,
        isInitializing: false,
        user: initial.user,
        error: null,
    }
}

export type AuthStoreOptions = {
    readonly initial?: RouterAuth | null | undefined
    readonly onChange?: ((auth: RouterAuth) => void) | undefined
}

export function useAuthStore(options: AuthStoreOptions = {}) {
    const initial = options.initial ?? null
    const [state, dispatch] = useReducer(authReducer, initial, initialAuthState)
    const seedRef = useRef(initial)
    const notify = (auth: RouterAuth) => {
        options.onChange?.(auth)
    }
    // See ADR-0025: last starter owns pending state.
    const generationRef = useRef(0)

    const currentGeneration = (): number => generationRef.current

    const claimGeneration = (): number => {
        generationRef.current += 1
        return generationRef.current
    }

    const saveUser = (userData: Readonly<User>) => {
        dispatch({ type: "SET_USER", user: userData })
        saveSessionToStorage(userData)
        notify({ isAuthenticated: true, user: userData })
    }

    const clearUser = () => {
        dispatch({ type: "CLEAR_USER" })
        clearSessionFromStorage()
        notify(signedOutAuth)
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

    const revalidateSeededSession = async (seed: RouterAuth) => {
        const generation = claimGeneration()
        const outcome = await lookupSession(seed.user)
        if (generation !== currentGeneration()) {
            return
        }
        if (outcome.kind === "verified") {
            saveUser(outcome.user)
        } else if (outcome.kind === "clear") {
            clearUser()
        }
    }

    const initializeAuth = async () => {
        const seed = seedRef.current
        if (seed !== null) {
            await revalidateSeededSession(seed)
            return
        }
        const generation = claimGeneration()
        dispatch({ type: "SET_INITIALIZING", isInitializing: true })
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
            dispatch({ type: "SET_INITIALIZING", isInitializing: false })
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
                dispatch({ type: "SET_INITIALIZING", isInitializing: false })
            }
        }
    }

    return {
        ...state,
        initializeAuth,
        signInWithPassword,
        signUpWithPassword,
        requestOtp,
        verifyOtp,
        signOut,
    }
}
