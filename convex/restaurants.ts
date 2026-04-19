import { query, mutation, action, internalAction } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { MAX_IMAGES } from "../src/core/constants"

type OpeningHoursData = {
    openNow: boolean
    periods: Array<{
        day: number
        openTime: string
        closeTime: string
    }>
    weekdayText: string[]
}

async function fetchOpeningHoursFromGoogle(placeId: string): Promise<OpeningHoursData> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        console.log("fetchOpeningHoursFromGoogle: No API key")
        return { openNow: true, periods: [], weekdayText: [] }
    }

    try {
        console.log("fetchOpeningHoursFromGoogle: Fetching for placeId:", placeId)
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=currentOpeningHours`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "currentOpeningHours",
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.log("fetchOpeningHoursFromGoogle: API error:", response.status, errorText)
            return { openNow: true, periods: [], weekdayText: [] }
        }

        const data = await response.json()
        console.log("fetchOpeningHoursFromGoogle: Result:", JSON.stringify(data.currentOpeningHours))
        return (
            data.currentOpeningHours || {
                openNow: true,
                periods: [],
                weekdayText: [],
            }
        )
    } catch (err) {
        console.log("fetchOpeningHoursFromGoogle: Catch error:", err)
        return { openNow: true, periods: [], weekdayText: [] }
    }
}

async function lookupPlaceIdFromGoogle(name: string, location: string): Promise<string | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        console.log("lookupPlaceIdFromGoogle: No API key")
        return null
    }

    try {
        const query = `${name}, ${location}`
        const encodedQuery = encodeURIComponent(query)
        console.log("lookupPlaceIdFromGoogle: Searching for:", query)

        const response = await fetch(
            `https://places.googleapis.com/v1/places:searchText?textQuery=${encodedQuery}&fields=places/id`,
            {
                headers: {
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": "places.id",
                },
            },
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.log("lookupPlaceIdFromGoogle: API error:", response.status, errorText)
            return null
        }

        const data = await response.json()
        console.log("lookupPlaceIdFromGoogle: Result:", JSON.stringify(data))
        return data.places?.[0]?.id ?? null
    } catch (err) {
        console.log("lookupPlaceIdFromGoogle: Catch error:", err)
        return null
    }
}

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
        const { images, placeId, ...rest } = args

        if (images && images.length > MAX_IMAGES) {
            throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
        }

        const restaurantData = {
            ...rest,
            ...(images !== undefined ? { images } : {}),
            placeId,
        }

        return ctx.db.insert("restaurants", restaurantData)
    },
})

export const addWithOpeningHours = action({
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
        placeId: v.string(),
    },
    handler: async (ctx, args) => {
        const { images, placeId, ...rest } = args

        if (images && images.length > MAX_IMAGES) {
            throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
        }

        let openingHours = null
        if (placeId) {
            openingHours = await fetchOpeningHoursFromGoogle(placeId)
        }

        const restaurantData = {
            ...rest,
            ...(images !== undefined ? { images } : {}),
            placeId,
            openingHours,
        }

        return ctx.db.insert("restaurants", restaurantData)
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

export const refreshOpeningHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        const restaurant = await ctx.db.get(restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        if (!restaurant.placeId) {
            throw new Error("No placeId to refresh")
        }

        const openingHours = await fetchOpeningHoursFromGoogle(restaurant.placeId)
        await ctx.db.patch(restaurantId, { openingHours })
    },
})

export const lookupPlaceIdAndHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        console.log("lookupPlaceIdAndHours: Starting for restaurantId:", restaurantId)
        const restaurant = await ctx.db.get(restaurantId)
        if (!restaurant) {
            console.log("lookupPlaceIdAndHours: Restaurant not found")
            throw new Error("Restaurant not found")
        }

        console.log("lookupPlaceIdAndHours: Restaurant:", restaurant.name, restaurant.location)

        if (!restaurant.name || !restaurant.location) {
            console.log("lookupPlaceIdAndHours: Missing name or location")
            throw new Error("Name and location required to lookup")
        }

        const newPlaceId = await lookupPlaceIdFromGoogle(restaurant.name, restaurant.location)
        console.log("lookupPlaceIdAndHours: Found placeId:", newPlaceId)

        if (!newPlaceId) {
            console.log("lookupPlaceIdAndHours: No placeId found, returning")
            return
        }

        console.log("lookupPlaceIdAndHours: Fetching opening hours...")
        const openingHours = await fetchOpeningHoursFromGoogle(newPlaceId)
        console.log("lookupPlaceIdAndHours: Got openingHours:", JSON.stringify(openingHours))

        await ctx.db.patch(restaurantId, { placeId: newPlaceId, openingHours })
        console.log("lookupPlaceIdAndHours: Done!")
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
