import { describe, expect, test } from "vitest"

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
