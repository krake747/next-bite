/// <reference types="node" />

export function getValidatedConvexSiteUrl(): string {
    const url = process.env.SITE_URL
    if (!url) {
        throw new Error("SITE_URL environment variable is not set")
    }
    return url
}
