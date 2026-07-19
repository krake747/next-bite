// oxlint-disable import/no-default-export

import { readFileSync } from "node:fs"

import { ConvexHttpClient } from "convex/browser"

function getConvexUrl(): string {
    const env = readFileSync(".env.local", "utf-8")
    const match = env.match(/VITE_CONVEX_URL=(.+)/)
    if (!match?.[1]) throw new Error("VITE_CONVEX_URL not found in .env.local")
    return match[1].trim()
}

// oxlint-disable-next-line import/no-default-export
export default async function globalTeardown(): Promise<void> {
    const client = new ConvexHttpClient(getConvexUrl())
    await client.mutation("test:cleanup", {})
}
