import { describe, test, expect } from "vitest"

import { parseEnv } from "./env"

const valid = {
    VITE_CONVEX_URL: "https://example.convex.cloud",
    VITE_CONVEX_SITE_URL: "https://example.convex.site",
    VITE_GOOGLE_MAPS_API_KEY: "test-key",
    DEV: false,
}

describe("parseEnv", () => {
    test("parses valid values", () => {
        expect(parseEnv(valid)).toEqual(valid)
    })

    test("rejects a missing value", () => {
        expect(() => parseEnv({ ...valid, VITE_CONVEX_URL: undefined })).toThrow("VITE_CONVEX_URL")
    })

    test("rejects a malformed URL", () => {
        expect(() => parseEnv({ ...valid, VITE_CONVEX_SITE_URL: "not-a-url" })).toThrow("VITE_CONVEX_SITE_URL")
    })

    test("rejects an empty maps key", () => {
        expect(() => parseEnv({ ...valid, VITE_GOOGLE_MAPS_API_KEY: "" })).toThrow("VITE_GOOGLE_MAPS_API_KEY")
    })
})
