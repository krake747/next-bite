import { describe, expect, test, vi } from "vitest"

import { resolveRequestAuth, type SessionUser } from "./auth.identity"

const user: SessionUser = { id: "user-1", email: "alex@example.com", name: "Alex", image: null }

async function settle<T>(value: T): Promise<T> {
    await Promise.resolve()
    return value
}

async function unreachable(): Promise<never> {
    await Promise.resolve()
    throw new Error("network")
}

function headersWith(cookie: string | null): Headers {
    return new Headers(cookie === null ? {} : { cookie })
}

describe("resolveRequestAuth", () => {
    test("treats a request with no session cookie as signed out without calling Convex", async () => {
        const fetchUser = vi.fn<() => Promise<SessionUser | null>>()

        await expect(resolveRequestAuth(headersWith(null), fetchUser)).resolves.toEqual({
            isAuthenticated: false,
            user: null,
        })
        expect(fetchUser).not.toHaveBeenCalled()
    })

    test("returns only safe identity fields for a valid session", async () => {
        const auth = await resolveRequestAuth(headersWith("__Secure-better-auth.session_token=secret-abc"), async () =>
            settle(user),
        )

        expect(auth).toEqual({ isAuthenticated: true, user })
        expect(JSON.stringify(auth)).not.toContain("secret-abc")
    })

    test("treats an expired or revoked session as signed out", async () => {
        await expect(
            resolveRequestAuth(headersWith("better-auth.session_token=stale"), async () => settle(null)),
        ).resolves.toEqual({ isAuthenticated: false, user: null })
    })

    test("reports an unknown session when Convex cannot be reached", async () => {
        await expect(resolveRequestAuth(headersWith("better-auth.session_token=abc"), unreachable)).resolves.toBeNull()
    })
})
