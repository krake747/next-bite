export const FALLBACK_DISPLAY_NAME = "Someone"

export const FALLBACK_GROUP_NAME = "Unknown group"

export function formatDisplayName(raw: string | null | undefined, fallbackEmail?: string): string {
    const trimmed = (raw ?? fallbackEmail ?? "").trim().slice(0, 60)
    return trimmed === "" ? FALLBACK_DISPLAY_NAME : trimmed
}

export async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}
