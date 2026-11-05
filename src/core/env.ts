import * as v from "valibot"

const absoluteUrl = v.pipe(v.string(), v.url())

const envSchema = v.object({
    VITE_CONVEX_URL: absoluteUrl,
    VITE_CONVEX_SITE_URL: absoluteUrl,
    VITE_GOOGLE_MAPS_API_KEY: v.pipe(v.string(), v.minLength(1)),
})

export function parseEnv(values: Readonly<Record<string, unknown>>) {
    const result = v.safeParse(envSchema, values)
    if (!result.success) {
        const lines: string[] = []
        for (const issue of result.issues) {
            lines.push(`\t${v.getDotPath(issue) ?? "env"}: ${issue.message}`)
        }
        throw new Error(`Invalid environment variables:\n${lines.join("\n")}`, { cause: result.issues })
    }

    return result.output
}

export const env = parseEnv({
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
})
