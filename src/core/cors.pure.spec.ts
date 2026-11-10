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

    test("reflects a preview origin matching the APP_ORIGINS pattern", () => {
        expect(
            resolveCorsHeaders("https://pr-123-next-bite.my-sub.workers.dev", [
                "https://pr-*-next-bite.my-sub.workers.dev",
            ]),
        ).toMatchObject({
            "Access-Control-Allow-Origin": "https://pr-123-next-bite.my-sub.workers.dev",
            Vary: "Origin",
        })
    })

    test("blocks look-alike preview origins", () => {
        const allowlist = ["https://pr-*-next-bite.my-sub.workers.dev"]
        const rejected = [
            "http://pr-123-next-bite.my-sub.workers.dev",
            "https://pr-123-next-bite.other.workers.dev",
            "https://pr-123-next-bite.my-sub.workers.dev.evil.com",
            "https://evil.my-sub.workers.dev",
            "https://pr-123-next-bitex.my-sub.workers.dev",
        ]
        for (const origin of rejected) {
            expect(resolveCorsHeaders(origin, allowlist)).toEqual({})
        }
    })

    test("matches preview hosts case-insensitively without crossing labels", () => {
        const allowlist = ["https://pr-*-next-bite.my-sub.workers.dev"]
        expect(resolveCorsHeaders("https://PR-123-NEXT-BITE.MY-SUB.WORKERS.DEV", allowlist)).toMatchObject({
            "Access-Control-Allow-Origin": "https://PR-123-NEXT-BITE.MY-SUB.WORKERS.DEV",
        })
        expect(resolveCorsHeaders("https://pr-1.2-next-bite.my-sub.workers.dev", allowlist)).toEqual({})
    })

    test("refuses malformed origins", () => {
        expect(resolveCorsHeaders("not a url", ["not a url"])).toEqual({})
        expect(resolveCorsHeaders("", ["https://app.example.com"])).toEqual({})
    })
})
