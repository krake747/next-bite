export async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}
