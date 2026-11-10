import { describe, expect, test } from "vitest"

import { corsAllowlist, resolveCorsHeaders } from "./cors"

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

    test("trusts the SITE_URL origin when APP_ORIGINS is empty", () => {
        const allowlist = corsAllowlist("https://nextbite.kevinkraemer.com", [])
        expect(resolveCorsHeaders("https://nextbite.kevinkraemer.com", allowlist)).toMatchObject({
            "Access-Control-Allow-Origin": "https://nextbite.kevinkraemer.com",
            Vary: "Origin",
        })
    })

    test("normalizes SITE_URL to its origin", () => {
        const allowlist = corsAllowlist("https://pr-12-next-bite.my-sub.workers.dev/path", [])
        expect(resolveCorsHeaders("https://pr-12-next-bite.my-sub.workers.dev", allowlist)).toMatchObject({
            "Access-Control-Allow-Origin": "https://pr-12-next-bite.my-sub.workers.dev",
        })
    })

    test("refuses an origin that is neither SITE_URL nor allowlisted", () => {
        expect(
            resolveCorsHeaders("https://evil.example.com", corsAllowlist("https://nextbite.kevinkraemer.com", [])),
        ).toEqual({})
    })

    test("ignores a missing or invalid SITE_URL and still uses APP_ORIGINS", () => {
        const allowlist = corsAllowlist("not a url", ["https://app.example.com"])
        expect(resolveCorsHeaders("https://app.example.com", allowlist)).toMatchObject({
            "Access-Control-Allow-Origin": "https://app.example.com",
        })
        expect(corsAllowlist(undefined, ["https://app.example.com"])).toEqual(["https://app.example.com"])
        expect(corsAllowlist("   ", ["https://app.example.com"])).toEqual(["https://app.example.com"])
    })

    test("refuses malformed origins", () => {
        expect(resolveCorsHeaders("not a url", ["not a url"])).toEqual({})
        expect(resolveCorsHeaders("", ["https://app.example.com"])).toEqual({})
    })
})
