export type ConvexGate = {
    readonly userId: string | null
    readonly attempt: number
    readonly fresh: boolean
    readonly timedOut: boolean
}

export type GatePhase = "waiting" | "ready" | "timed-out"

export function openGate(attempt: number): ConvexGate {
    return { userId: null, attempt, fresh: true, timedOut: false }
}

export function settleGate(
    gate: ConvexGate,
    sessionKey: string | null,
    attempt: number,
    convexAuthenticated: boolean,
): ConvexGate {
    if (gate.userId !== sessionKey) {
        return { userId: sessionKey, attempt, fresh: gate.userId === null || !convexAuthenticated, timedOut: false }
    }
    const fresh = gate.fresh || !convexAuthenticated
    const timedOut = gate.attempt === attempt && gate.timedOut && !(fresh && convexAuthenticated)
    if (attempt === gate.attempt && fresh === gate.fresh && timedOut === gate.timedOut) {
        return gate
    }
    return { ...gate, attempt, fresh, timedOut }
}

export function expireGate(gate: ConvexGate, owner: string, attempt: number): ConvexGate {
    return gate.userId === owner && gate.attempt === attempt ? { ...gate, timedOut: true } : gate
}

export function gatePhase(gate: ConvexGate, convexAuthenticated: boolean): GatePhase {
    if (gate.userId !== null && gate.fresh && convexAuthenticated) {
        return "ready"
    }
    return gate.timedOut ? "timed-out" : "waiting"
}
