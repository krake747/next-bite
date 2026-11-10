import { isLoopbackOrigin } from "./env"

// Pure CORS policy for the browser-facing upload endpoint. Only trusted app
// origins (plus loopback for local development) get a reflected
// Access-Control-Allow-Origin; everything else gets no CORS headers so the
// browser blocks the response. Non-browser callers send no Origin and need no
// CORS headers. The allowlist holds exact origins plus preview patterns such as
// https://pr-*-next-bite.<subdomain>.workers.dev from APP_ORIGINS, matched
// label by label on the parsed host so look-alikes stay blocked. Pure so the
// policy is unit-testable: t.fetch cannot observe Origin-based behavior because
// the test Request drops forbidden headers.
export function isAllowedOrigin(origin: string, allowlist: ReadonlyArray<string>): boolean {
    let parsed: URL
    try {
        parsed = new URL(origin)
    } catch {
        return false
    }
    if (allowlist.includes(origin)) {
        return true
    }
    if (isLoopbackOrigin(origin)) {
        return true
    }
    return allowlist.some((entry) => matchesOriginPattern(parsed, entry))
}

function matchesOriginPattern(origin: URL, pattern: string): boolean {
    if (!pattern.includes("*") || !pattern.includes("://")) {
        return false
    }
    let patternUrl: URL
    try {
        patternUrl = new URL(pattern)
    } catch {
        return false
    }
    if (patternUrl.protocol !== origin.protocol || patternUrl.port !== origin.port) {
        return false
    }
    if (origin.username !== "" || origin.password !== "") {
        return false
    }
    const patternLabels = patternUrl.hostname.split(".")
    const originLabels = origin.hostname.split(".")
    if (patternLabels.length !== originLabels.length) {
        return false
    }
    return patternLabels.every((patternLabel, index) => {
        const originLabel = originLabels[index] ?? ""
        if (!patternLabel.includes("*")) {
            return patternLabel === originLabel
        }
        return labelPatternToRegExp(patternLabel).test(originLabel)
    })
}

function labelPatternToRegExp(labelPattern: string): RegExp {
    const source = labelPattern
        .split("*")
        .map((part) => part.replaceAll(/[^A-Za-z0-9-]/g, (char) => `\\${char}`))
        .join("[^.]*")
    return new RegExp(`^${source}$`, "i")
}

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
    if (!isAllowedOrigin(origin, allowlist)) {
        return {}
    }
    return {
        ...base,
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
    }
}
