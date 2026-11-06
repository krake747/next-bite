import { internalMutation } from "./_generated/server"

export const cleanupOrphanedStorage = internalMutation({
    args: {},
    handler: async (ctx) => {
        const restaurants = await ctx.db.query("restaurants").collect()

        const referencedStorageIds = new Set<string>()
        for (const restaurant of restaurants) {
            for (const img of restaurant.images) {
                referencedStorageIds.add(img.storageId)
            }
        }

        return { referenced: Array.from(referencedStorageIds) }
    },
})
