import { internalMutation } from "./_generated/server"

export const cleanupOrphanedStorage = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now()
        const expired = await ctx.db
            .query("uploads")
            .withIndex("by_expires", (q) => q.lte("expiresAt", now))
            .take(100)

        let deleted = 0
        const referenced: string[] = []
        for (const row of expired) {
            if (row.purpose !== undefined && row.purpose !== "transient") {
                continue
            }
            if (row.restaurantId !== undefined) {
                referenced.push(row.storageId)
                continue
            }
            try {
                await ctx.storage.delete(row.storageId)
            } catch {}
            await ctx.db.delete(row._id)
            deleted += 1
        }

        return { deleted, checked: expired.length }
    },
})
