import { describe, expect, test } from "vitest"

import { resolveCorsHeaders } from "../../convex/cors"

describe("resolveCorsHeaders", () => {
    test("sends no CORS headers without an origin", () => {
        expect(resolveCorsHeaders(null, ["https://app.example.com"])).toEqual({})
    })

    test("reflects a trusted app origin", () => {
        expect(resolveCorsHeaders("https://app.example.com", ["https://app.example.com"])).toMatchObject({
            "Access-Control-Allow-Origin": "https://app.example.com",
            Vary: "Origin",
        })
    })

    test("refuses an unlisted origin", () => {
        expect(resolveCorsHeaders("https://evil.example.com", ["https://app.example.com"])).toEqual({})
    })

    test("reflects loopback origins without allowlisting", () => {
        expect(resolveCorsHeaders("http://localhost:5173", [])).toMatchObject({
            "Access-Control-Allow-Origin": "http://localhost:5173",
        })
        expect(resolveCorsHeaders("http://127.0.0.1:3000", [])).toMatchObject({
            "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
        })
    })

    test("refuses malformed origins", () => {
        expect(resolveCorsHeaders("not a url", ["not a url"])).toEqual({})
        expect(resolveCorsHeaders("", ["https://app.example.com"])).toEqual({})
    })
})
