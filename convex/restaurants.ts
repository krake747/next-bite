import { query, mutation, internalAction } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { MAX_IMAGES } from "../src/core/constants"

export const get = query(async (ctx) => ctx.db.query("restaurants").collect())

export const add = mutation({
    args: {
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.string(),
        rating: v.optional(v.number()),
        images: v.optional(v.array(v.object({ url: v.string(), storageId: v.string() }))),
        placeId: v.optional(v.string()),
        openingHours: v.optional(
            v.object({
                openNow: v.boolean(),
                periods: v.array(
                    v.object({
                        day: v.number(),
                        openTime: v.string(),
                        closeTime: v.string(),
                    }),
                ),
                weekdayText: v.array(v.string()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const { images, ...rest } = args

        if (images && images.length > MAX_IMAGES) {
            throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
        }

        return ctx.db.insert("restaurants", { ...rest, ...(images !== undefined ? { images } : {}) })
    },
})

export const update = mutation({
    args: {
        id: v.id("restaurants"),
        name: v.optional(v.string()),
        cuisine: v.optional(v.string()),
        location: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.optional(v.string()),
        rating: v.optional(v.number()),
        images: v.optional(v.array(v.object({ url: v.string(), storageId: v.string() }))),
        placeId: v.optional(v.string()),
        openingHours: v.optional(
            v.object({
                openNow: v.boolean(),
                periods: v.array(
                    v.object({
                        day: v.number(),
                        openTime: v.string(),
                        closeTime: v.string(),
                    }),
                ),
                weekdayText: v.array(v.string()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const { id, images, ...updates } = args

        if (images && images.length > MAX_IMAGES) {
            throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
        }

        const updateData: typeof updates & { images?: typeof images } = updates
        if (images !== undefined) {
            updateData.images = images
        }

        return ctx.db.patch(id, updateData)
    },
})

export const deleteImage = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        imageUrl: v.string(),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        await ctx.storage.delete(args.storageId as Id<"_storage">)

        const currentImages = restaurant.images ?? []
        const updatedImages = currentImages.filter((img) => img.url !== args.imageUrl)

        if (updatedImages.length !== currentImages.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const cleanupStorage = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Unauthorized: authentication required")
        }

        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        await ctx.storage.delete(args.storageId as Id<"_storage">)

        const currentImages = restaurant.images ?? []
        const updatedImages = currentImages.filter((img) => img.storageId !== args.storageId)

        if (updatedImages.length !== currentImages.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const getPlaceOpeningHours = internalAction({
    args: { placeId: v.string() },
    returns: v.object({
        openNow: v.boolean(),
        periods: v.array(
            v.object({
                day: v.number(),
                openTime: v.string(),
                closeTime: v.string(),
            }),
        ),
        weekdayText: v.array(v.string()),
    }),
    handler: async (_ctx, { placeId }) => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            throw new Error("GOOGLE_MAPS_API_KEY not configured")
        }

        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=currentOpeningHours`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "currentOpeningHours",
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Google Places API error: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        return (
            data.currentOpeningHours || {
                openNow: true,
                periods: [],
                weekdayText: [],
            }
        )
    },
})
