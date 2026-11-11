import { describe, expect, test } from "vitest"

import { expireGate, gatePhase, openGate, settleGate, type ConvexGate } from "./session.gate"

function settle(gate: ConvexGate, sessionKey: string | null, convexAuthenticated: boolean, attempt = 0) {
    return settleGate(gate, sessionKey, attempt, convexAuthenticated)
}

describe("session gate", () => {
    test("opens ready when Convex already confirms the first user", () => {
        const gate = settle(openGate(0), "user-1", true)

        expect(gatePhase(gate, true)).toBe("ready")
    })

    test("waits while Convex has not confirmed", () => {
        const gate = settle(openGate(0), "user-1", false)

        expect(gatePhase(gate, false)).toBe("waiting")
    })

    test("times out without ever reporting ready", () => {
        const gate = expireGate(settle(openGate(0), "user-1", false), "user-1", 0)

        expect(gatePhase(gate, false)).toBe("timed-out")
    })

    test("ignores a timeout owned by another user or attempt", () => {
        const gate = settle(openGate(0), "user-1", false)

        expect(expireGate(gate, "user-2", 0)).toBe(gate)
        expect(expireGate(gate, "user-1", 1)).toBe(gate)
    })

    test("holds a direct account switch until Convex re-confirms", () => {
        const first = settle(openGate(0), "user-1", true)
        const switched = settle(first, "user-2", true)

        expect(gatePhase(switched, true)).toBe("waiting")

        const cleared = settle(switched, "user-2", false)
        const confirmed = settle(cleared, "user-2", true)

        expect(gatePhase(confirmed, true)).toBe("ready")
    })
})
