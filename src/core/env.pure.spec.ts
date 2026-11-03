import { describe, it, expect } from "vitest"

import { parseEnv } from "./env"

const valid = {
    VITE_CONVEX_URL: "https://example.convex.cloud",
    VITE_CONVEX_SITE_URL: "https://example.convex.site",
    VITE_GOOGLE_MAPS_API_KEY: "test-key",
}

describe("parseEnv", () => {
    it("parses valid values", () => {
        expect(parseEnv(valid)).toEqual(valid)
    })

    it("rejects a missing value", () => {
        expect(() => parseEnv({ ...valid, VITE_CONVEX_URL: undefined })).toThrow("VITE_CONVEX_URL")
    })

    it("rejects a malformed URL", () => {
        expect(() => parseEnv({ ...valid, VITE_CONVEX_SITE_URL: "not-a-url" })).toThrow("VITE_CONVEX_SITE_URL")
    })

    it("rejects an empty maps key", () => {
        expect(() => parseEnv({ ...valid, VITE_GOOGLE_MAPS_API_KEY: "" })).toThrow("VITE_GOOGLE_MAPS_API_KEY")
    })
})
