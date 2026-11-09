import { useEffect, useState, useSyncExternalStore } from "react"

import { useAuthContext } from "@api/auth.provider"
import {
    useConvexAuthPhase,
    useConvexClient,
    useConvexMutation,
    useConvexQuery,
    useSuspenseConvexQuery,
} from "@api/convex.context"
import { api } from "@api/endpoints"

import { expireGate, gatePhase, openGate, settleGate, type ConvexGate, type GatePhase } from "./session.gate"

const CONVEX_AUTH_TIMEOUT_MS = 10000

export type SessionStatus =
    | { readonly kind: "loading" }
    | { readonly kind: "signed-out" }
    | { readonly kind: "ready"; readonly userId: string }
    | { readonly kind: "timed-out"; readonly userId: string; readonly retry: () => void }

let gateAttempt = 0
const gateAttemptListeners = new Set<() => void>()

function subscribeGateAttempt(listener: () => void): () => void {
    gateAttemptListeners.add(listener)
    return () => {
        gateAttemptListeners.delete(listener)
    }
}

function getGateAttempt(): number {
    return gateAttempt
}

export function retrySessionGate(): void {
    gateAttempt += 1
    for (const listener of gateAttemptListeners) {
        listener()
    }
}

function sessionKeyOf(
    isAuthenticated: boolean,
    isLoading: boolean,
    user: Readonly<{ id: string }> | null,
): string | null {
    return !isAuthenticated || isLoading || user === null ? null : user.id
}

function toSessionStatus(sessionKey: string | null, isLoading: boolean, phase: GatePhase): SessionStatus {
    if (sessionKey === null) {
        return isLoading ? { kind: "loading" } : { kind: "signed-out" }
    }
    if (phase === "ready") {
        return { kind: "ready", userId: sessionKey }
    }
    if (phase === "timed-out") {
        return { kind: "timed-out", userId: sessionKey, retry: retrySessionGate }
    }
    return { kind: "loading" }
}

function useGateTimeout(
    owner: string | null,
    attempt: number,
    timeoutMs: number,
    setGate: (update: (gate: ConvexGate) => ConvexGate) => void,
): void {
    useEffect(() => {
        const timer =
            owner === null
                ? undefined
                : setTimeout(() => {
                      setGate((current) => expireGate(current, owner, attempt))
                  }, timeoutMs)
        return () => {
            clearTimeout(timer)
        }
    }, [owner, attempt, timeoutMs, setGate])
}

export function useSessionStatus(options?: Readonly<{ timeoutMs?: number }>): SessionStatus {
    const { isAuthenticated, isLoading, user } = useAuthContext()
    const client = useConvexClient()
    const convexAuthenticated = useConvexAuthPhase() === "authenticated" && client !== null
    const attempt = useSyncExternalStore(subscribeGateAttempt, getGateAttempt, getGateAttempt)
    const sessionKey = sessionKeyOf(isAuthenticated, isLoading, user)
    const [gate, setGate] = useState<ConvexGate>(() => openGate(attempt))
    const settled = settleGate(gate, sessionKey, attempt, convexAuthenticated)
    if (settled !== gate) {
        setGate(settled)
    }
    const phase = gatePhase(settled, convexAuthenticated)
    useGateTimeout(
        phase === "waiting" ? sessionKey : null,
        attempt,
        options?.timeoutMs ?? CONVEX_AUTH_TIMEOUT_MS,
        setGate,
    )
    return toSessionStatus(sessionKey, isLoading, phase)
}

export function useSessionKey(): string | null {
    const status = useSessionStatus()
    return status.kind === "ready" ? status.userId : null
}

type GatedId<T> = { readonly skip: true; readonly id: undefined } | { readonly skip: false; readonly id: T }

// Session-gated optional id: skip is true until the session is ready and the id is present.
// In the `skip: false` branch `id` narrows to `T`, so query args build with no casts.
export function gateId<T>(status: SessionStatus, id: T | undefined): GatedId<T> {
    if (status.kind !== "ready" || id === undefined) {
        return { skip: true, id: undefined }
    }
    return { skip: false, id }
}

export const useAuth = useAuthContext

export const useMyProfile = () => useSuspenseConvexQuery(api.users.getMe)

export const useUpdateProfile = () => useConvexMutation(api.users.updateMe)

export function useEnsureProfile(): void {
    const auth = useAuthContext()
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    useEffect(() => {
        // Profiles back display names and email lookup. Signups create the auth session but no
        // profile row, so every ready session ensures one exactly once. The readiness gate
        // matters: firing pre-install runs the mutation unauthenticated. Failures stay silent:
        // callers already fall back to placeholder names.
        if (sessionKey === null || client === null) {
            return
        }
        const user = auth.user
        if (user === null || user.id !== sessionKey) {
            return
        }
        const { email, name } = user
        void client
            .mutation(api.users.ensureProfile, {
                email,
                ...(name !== undefined && name !== null ? { name } : {}),
            })
            .catch(() => {})
    }, [sessionKey, client, auth.user])
}

export type AuthMethods = {
    readonly password: boolean
    readonly emailOtp: boolean
}

export const useAuthMethods = (): AuthMethods | undefined => useConvexQuery(api.auth.getAuthMethods)
