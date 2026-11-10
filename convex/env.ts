/// <reference types="node" />

import { env } from "./_generated/server"

// Single owner for backend environment reads. Values come from the vars declared in
// convex.config.ts (plus the platform CONVEX_SITE_URL), typed through the generated env.
// Everything here is optional except the site URL: callers fail closed on missing values.

function isPresent(value: string | undefined): value is string {
    return value !== undefined && value.trim() !== ""
}

export function getValidatedSiteUrl(): string {
    const url = env.SITE_URL
    if (!isPresent(url)) {
        throw new Error("SITE_URL environment variable is not set")
    }
    return url
}

// Trusted browser origins for upload CORS, as a comma-separated list. Loopback
// origins are always trusted so local development works with zero config;
// every other browser origin must be listed here or the browser blocks the
// response. Non-browser callers send no Origin and are unaffected.
export function appOrigins(): string[] {
    const raw = env.APP_ORIGINS
    if (!isPresent(raw)) {
        return []
    }
    return raw
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin !== "")
}

export function isLoopbackOrigin(origin: string): boolean {
    try {
        const { hostname } = new URL(origin)
        return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1"
    } catch {
        return false
    }
}

export function googleMapsApiKey(): string | undefined {
    const key = env.GOOGLE_MAPS_API_KEY
    return isPresent(key) ? key : undefined
}

export function isEmailOtpEnabled(): boolean {
    return env.AUTH_EMAIL_OTP_ENABLED === "true"
}

export function hasMailgunConfig(): boolean {
    return mailgunConfig() !== null
}

// Explicit opt-in only. Missing mail configuration fails closed everywhere else, including
// preview and production, even when the OTP flag is on.
export function isMailDevFallback(): boolean {
    return env.MAILGUN_DEV_FALLBACK === "true"
}

export function mailgunConfig(): { apiKey: string; domain: string } | null {
    const apiKey = env.MAILGUN_API_KEY
    const domain = env.MAILGUN_DOMAIN
    if (!isPresent(apiKey) || !isPresent(domain)) {
        return null
    }
    return { apiKey, domain }
}
