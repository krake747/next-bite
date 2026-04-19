import { internalMutation } from "./_generated/server"

export const convertImagesToObjects = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    let convertedCount = 0
    let skipCount = 0

    for (const restaurant of restaurants) {
        const images = restaurant.images as string[] | undefined
        if (!images) continue

        const hasOldFormat = typeof images[0] === "string"
        if (!hasOldFormat) {
            skipCount++
            continue
        }

        const newImages = images.map((url) => {
            const matches = url.match(/\/storage\/([a-f0-9-]+)$/)
            const storageId = matches?.[1] ?? url
            return { url, storageId }
        })

        await ctx.db.patch(restaurant._id, { images: newImages })
        convertedCount++
    }

    return { converted: convertedCount, skipped: skipCount }
})

export const cleanupOrphanedStorage = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    const referencedStorageIds = new Set<string>()
    for (const restaurant of restaurants) {
        const images = restaurant.images as { url: string; storageId: string }[] | undefined
        if (images) {
            for (const img of images) {
                referencedStorageIds.add(img.storageId)
            }
        }
    }

    return { referenced: Array.from(referencedStorageIds) }
})
