import { type ConvexClient } from "convex/browser"
import { useEffect, useState, useSyncExternalStore } from "react"

import { api } from "@convex/_generated/api"

import { sleep } from "./async"
import { getConvexSessionToken } from "./auth-client"
import { useAuth as useAuthSource } from "./auth-provider"
import { useConvexClient } from "./convex-client.tsx"

async function probeConvexAuth(client: ConvexClient): Promise<boolean> {
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

export const CONVEX_AUTH_TIMEOUT_MS = 10000
export const CONVEX_AUTH_POLL_MS = 500

async function settleConvexAuth(
    client: ConvexClient,
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
