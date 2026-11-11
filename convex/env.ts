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
