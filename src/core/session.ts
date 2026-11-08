import { type ConvexReactClient } from "convex/react"
import { useEffect, useState, useSyncExternalStore } from "react"

import { useAuth as useAuthSource } from "@api/auth.provider"
import { getConvexSessionToken } from "@api/auth.sdk"
import { useConvexClient, useConvexMutation, useConvexQuery } from "@api/convex.context"
import { api } from "@api/endpoints"

import { sleep } from "./async"

async function probeConvexAuth(client: ConvexReactClient): Promise<boolean> {
    const token = await getConvexSessionToken()
    if (token === null) {
        return false
    }
    try {
        await client.query(api.friendships.listFriends, {})
        return true
    } catch {
        return false
    }
}

const CONVEX_AUTH_TIMEOUT_MS = 10000
const CONVEX_AUTH_POLL_MS = 500

async function settleConvexAuth(
    client: ConvexReactClient,
    isCancelled: () => boolean,
    timeoutMs: number = CONVEX_AUTH_TIMEOUT_MS,
): Promise<boolean> {
    const deadline = Date.now() + timeoutMs
    while (!isCancelled()) {
        if (await probeConvexAuth(client)) {
            return true
        }
        if (Date.now() >= deadline) {
            return false
        }
        await sleep(CONVEX_AUTH_POLL_MS)
    }
    return false
}

export type SessionStatus =
    | { readonly kind: "loading" }
    | { readonly kind: "signed-out" }
    | { readonly kind: "ready"; readonly userId: string }
    | { readonly kind: "timed-out"; readonly userId: string; readonly retry: () => void }

type ConvexGate = {
    readonly userId: string | null
    readonly outcome: "probing" | "ready" | "timed-out"
}

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

export function useSessionStatus(options?: Readonly<{ timeoutMs?: number }>): SessionStatus {
    const { isAuthenticated, isLoading, user } = useAuthSource()
    const client = useConvexClient()
    const gateGeneration = useSyncExternalStore(subscribeGateAttempt, getGateAttempt, getGateAttempt)
    const [gate, setGate] = useState<ConvexGate>({ userId: null, outcome: "probing" })
    const sessionKey = !isAuthenticated || isLoading || user === null ? null : user.id
    const timeoutMs = options?.timeoutMs ?? CONVEX_AUTH_TIMEOUT_MS
    useEffect(() => {
        let cancelled = false
        if (sessionKey === null || client === null) {
            setGate({ userId: null, outcome: "probing" })
        } else {
            const owner = sessionKey
            setGate({ userId: owner, outcome: "probing" })
            void settleConvexAuth(client, () => cancelled, timeoutMs).then((verified) => {
                if (!cancelled) {
                    setGate({ userId: owner, outcome: verified ? "ready" : "timed-out" })
                }
            })
        }
        return () => {
            cancelled = true
        }
    }, [sessionKey, client, gateGeneration, timeoutMs])
    if (sessionKey === null) {
        return isLoading ? { kind: "loading" } : { kind: "signed-out" }
    }
    if (gate.userId !== sessionKey) {
        return { kind: "loading" }
    }
    if (gate.outcome === "ready") {
        return { kind: "ready", userId: sessionKey }
    }
    if (gate.outcome === "timed-out") {
        return {
            kind: "timed-out",
            userId: sessionKey,
            retry: retrySessionGate,
        }
    }
    return { kind: "loading" }
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

export const useAuth = useAuthSource

export const useUpdateProfile = () => useConvexMutation(api.users.updateMe)

export function useEnsureProfile(): void {
    const auth = useAuthSource()
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
