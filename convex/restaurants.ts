import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
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

        const data = (await response.json()) as { currentOpeningHours?: OpeningHoursData }
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

export const _getRestaurantById = internalQuery({
    args: { id: v.id("restaurants") },
    handler: async (ctx, { id }) => ctx.db.get(id),
})

export const _patchRestaurant = internalMutation({
    args: {
        id: v.id("restaurants"),
        placeId: v.optional(v.string()),
        openingHours: v.optional(v.any()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
    },
    handler: async (ctx, { id, placeId, openingHours, lat, lng }) => {
        ctx.db.patch(id, {
            ...(placeId !== undefined ? { placeId } : {}),
            ...(openingHours !== undefined ? { openingHours } : {}),
            ...(lat !== undefined ? { lat } : {}),
            ...(lng !== undefined ? { lng } : {}),
        })
    },
})

export const _insertRestaurant = internalMutation({
    args: v.any(),
    handler: async (ctx, args) => ctx.db.insert("restaurants", args),
})

type GooglePlaceResult = {
    placeId: string | null
    lat: number | null
    lng: number | null
}

async function lookupPlaceIdFromGoogle(name: string, location: string): Promise<GooglePlaceResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        console.log("lookupPlaceIdFromGoogle: No API key")
        return { placeId: null, lat: null, lng: null }
    }

    try {
        const query = `${name}, ${location}`
        const encodedQuery = encodeURIComponent(query)
        console.log("lookupPlaceIdFromGoogle: Searching for:", query)

        const response = await fetch(
            `https://places.googleapis.com/v1/places:searchText?textQuery=${encodedQuery}&fields=places/id,places.location`,
            {
                headers: {
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": "places.id,places.location",
                },
            },
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.log("lookupPlaceIdFromGoogle: API error:", response.status, errorText)
            return { placeId: null, lat: null, lng: null }
        }

        const data = (await response.json()) as {
            places?: Array<{
                id?: string
                location?: { latitude?: number; longitude?: number }
            }>
        }
        console.log("lookupPlaceIdFromGoogle: Result:", JSON.stringify(data))

        const place = data.places?.[0]
        return {
            placeId: place?.id ?? null,
            lat: place?.location?.latitude ?? null,
            lng: place?.location?.longitude ?? null,
        }
    } catch (err) {
        console.log("lookupPlaceIdFromGoogle: Catch error:", err)
        return { placeId: null, lat: null, lng: null }
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

        const restaurantData: {
            name: string
            cuisine: string
            location: string
            addedBy: string
            lat?: number
            lng?: number
            notes?: string
            link?: string
            rating?: number
            images?: typeof images
            placeId?: string
        } = {
            name: rest.name,
            cuisine: rest.cuisine,
            location: rest.location,
            addedBy: rest.addedBy,
            ...(images !== undefined ? { images } : {}),
            ...(placeId !== undefined ? { placeId } : {}),
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
    },
    handler: async (ctx, args): Promise<Id<"restaurants">> => {
        const { images, lat, lng, ...rest } = args

        if (images && images.length > MAX_IMAGES) {
            throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
        }

        const google = await lookupPlaceIdFromGoogle(rest.name, rest.location)
        console.log("addWithOpeningHours: Google result:", JSON.stringify(google))

        let openingHours: OpeningHoursData | undefined
        if (google.placeId) {
            openingHours = await fetchOpeningHoursFromGoogle(google.placeId)
        }

        const restaurantData = {
            ...rest,
            ...(images !== undefined ? { images } : {}),
            placeId: google.placeId ?? undefined,
            lat: google.lat ?? lat ?? undefined,
            lng: google.lng ?? lng ?? undefined,
            ...(openingHours !== undefined ? { openingHours } : {}),
        }

        return ctx.runMutation(internal.restaurants._insertRestaurant, restaurantData)
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
        const restaurant = await ctx.runQuery(internal.restaurants._getRestaurantById, { id: restaurantId })
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        if (!restaurant.placeId) {
            throw new Error("No placeId to refresh")
        }

        const openingHours = await fetchOpeningHoursFromGoogle(restaurant.placeId)
        await ctx.runMutation(internal.restaurants._patchRestaurant, { id: restaurantId, openingHours })
    },
})

export const lookupPlaceIdAndHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        console.log("lookupPlaceIdAndHours: Starting for restaurantId:", restaurantId)
        const restaurant = await ctx.runQuery(internal.restaurants._getRestaurantById, { id: restaurantId })
        if (!restaurant) {
            console.log("lookupPlaceIdAndHours: Restaurant not found")
            throw new Error("Restaurant not found")
        }

        console.log("lookupPlaceIdAndHours: Restaurant:", restaurant.name, restaurant.location)

        if (!restaurant.name || !restaurant.location) {
            console.log("lookupPlaceIdAndHours: Missing name or location")
            throw new Error("Name and location required to lookup")
        }

        const google = await lookupPlaceIdFromGoogle(restaurant.name, restaurant.location)
        console.log("lookupPlaceIdAndHours: Google result:", JSON.stringify(google))

        if (!google.placeId) {
            console.log("lookupPlaceIdAndHours: No placeId found, returning")
            return
        }

        console.log("lookupPlaceIdAndHours: Fetching opening hours...")
        const openingHours = await fetchOpeningHoursFromGoogle(google.placeId)
        console.log("lookupPlaceIdAndHours: Got openingHours:", JSON.stringify(openingHours))

        const patchArgs: { id: Id<"restaurants">; placeId: string; openingHours: OpeningHoursData } & {
            lat?: number
            lng?: number
        } = {
            id: restaurantId,
            placeId: google.placeId,
            openingHours,
        }
        if (google.lat !== null) patchArgs.lat = google.lat as number
        if (google.lng !== null) patchArgs.lng = google.lng as number
        await ctx.runMutation(internal.restaurants._patchRestaurant, patchArgs)
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

        const data = (await response.json()) as { currentOpeningHours?: OpeningHoursData }
        return (
            data.currentOpeningHours || {
                openNow: true,
                periods: [],
                weekdayText: [],
            }
        )
    },
})
