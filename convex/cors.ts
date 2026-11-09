import { isLoopbackOrigin } from "./env"

// Pure CORS policy for the browser-facing upload endpoint. Only trusted app
// origins (plus loopback for local development) get a reflected
// Access-Control-Allow-Origin; everything else gets no CORS headers so the
// browser blocks the response. Non-browser callers send no Origin and need no
// CORS headers. Pure so the policy is unit-testable: t.fetch cannot observe
// Origin-based behavior because the test Request drops forbidden headers.
export function resolveCorsHeaders(origin: string | null, allowlist: ReadonlyArray<string>): Record<string, string> {
    const base = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    if (origin === null || origin === "") {
        return {}
    }
    try {
        void new URL(origin)
    } catch {
        return {}
    }
    if (!allowlist.includes(origin) && !isLoopbackOrigin(origin)) {
        return {}
    }
    return {
        ...base,
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
    }
}
