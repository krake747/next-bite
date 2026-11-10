import { describe, expect, test } from "vitest"

import { signedOutAuth, type RouterAuth } from "./auth.identity"
import { createAuthSnapshot } from "./auth.session"

const alex: RouterAuth = { isAuthenticated: true, user: { id: "user-1", email: "alex@example.com" } }
const sam: RouterAuth = { isAuthenticated: true, user: { id: "user-2", email: "sam@example.com" } }

describe("auth snapshot", () => {
    test("starts unknown", () => {
        expect(createAuthSnapshot().current()).toBeNull()
    })

    test("reports a change only when the identity changes", () => {
        const snapshot = createAuthSnapshot()

        expect(snapshot.publish(alex)).toBe(true)
        expect(snapshot.publish({ ...alex, user: { id: "user-1", email: "alex@example.com", name: "Alex" } })).toBe(
            false,
        )
        expect(snapshot.publish(sam)).toBe(true)
        expect(snapshot.publish(signedOutAuth)).toBe(true)
        expect(snapshot.publish(signedOutAuth)).toBe(false)
        expect(snapshot.current()).toEqual(signedOutAuth)
    })

    test("keeps each router's session separate", () => {
        const first = createAuthSnapshot()
        const second = createAuthSnapshot()

        first.publish(alex)

        expect(second.current()).toBeNull()
    })
})
