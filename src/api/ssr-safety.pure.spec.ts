import { describe, expect, test } from "vitest"

// The server bundle statically includes every route-reachable module, so the
// modules below must evaluate without browser globals. This guards the
// invariant that keeps them out of `*.client.*` naming: safe to bundle for
// the server, only ever used on the client.
describe("server import safety", () => {
    test("client SDK modules evaluate without browser globals", async () => {
        await import("@api/auth.sdk")
        await import("@api/convex.context")
        await import("@api/auth.provider")
        await import("@api/auth.store")
        await import("@core/session")
        expect(true).toBe(true)
    })
})
