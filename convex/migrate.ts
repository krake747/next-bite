import * as valibot from "valibot"

import { internalMutation } from "./_generated/server"

const legacyImagesSchema = valibot.union([
    valibot.array(valibot.string()),
    valibot.array(valibot.object({ url: valibot.string(), storageId: valibot.string() })),
    valibot.undefined(),
])

export const convertImagesToObjects = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    let convertedCount = 0
    let skipCount = 0

    for (const restaurant of restaurants) {
        const parsed = valibot.safeParse(legacyImagesSchema, restaurant.images)
        if (!parsed.success) {
            skipCount += 1
            continue
        }

        const images = parsed.output
        if (!images) {
            continue
        }

        const oldUrls = images.filter((image): image is string => typeof image === "string")
        if (oldUrls.length === 0 || oldUrls.length !== images.length) {
            skipCount += 1
            continue
        }

        const newImages = oldUrls.map((url) => {
            const matches = url.match(/\/storage\/([a-f0-9-]+)$/)
            const storageId = matches?.[1] ?? url
            return { url, storageId }
        })

        await ctx.db.patch(restaurant._id, { images: newImages })
        convertedCount += 1
    }

    return { converted: convertedCount, skipped: skipCount }
})

export const cleanupOrphanedStorage = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    const referencedStorageIds = new Set<string>()
    for (const restaurant of restaurants) {
        const images = restaurant.images
        if (images) {
            for (const img of images) {
                referencedStorageIds.add(img.storageId)
            }
        }
    }

    return { referenced: Array.from(referencedStorageIds) }
})
