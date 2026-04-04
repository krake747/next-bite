/// <reference types="node" />

export function getValidatedConvexSiteUrl(): string {
    const url = process.env.CONVEX_SITE_URL
    if (!url) {
        throw new Error("CONVEX_SITE_URL environment variable is not set")
    }
    return url
}
