import { v, type Infer } from "convex/values"
import * as valibot from "valibot"

import { MAX_IMAGES } from "../src/core/constants"
import { internal } from "./_generated/api"
import { type Doc, type Id } from "./_generated/dataModel"
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server"
import { requireUserId, FALLBACK_DISPLAY_NAME } from "./helpers"
import { coordsValidator, enrichmentValidator, openingHoursValidator, restaurantImageValidator } from "./validators"
import { isRestaurantVisibleTo } from "./visibility"

type OpeningHoursData = Infer<typeof openingHoursValidator>

function assertImageLimit(images: ReadonlyArray<unknown>): void {
    if (images.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
    }
}

// Storage IDs cross the client as plain strings, so the type system cannot prove them.
// Convex validates them at runtime inside storage.delete.
function asStorageId(storageId: string): Id<"_storage"> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion; see above
    return storageId as unknown as Id<"_storage">
}

const googleOpeningHoursSchema = valibot.object({
    currentOpeningHours: valibot.optional(
        valibot.object({
            openNow: valibot.optional(valibot.boolean()),
            periods: valibot.optional(
                valibot.array(
                    valibot.object({
                        open: valibot.optional(
                            valibot.object({
                                day: valibot.optional(valibot.number()),
                                hour: valibot.optional(valibot.number()),
                                minute: valibot.optional(valibot.number()),
                            }),
                        ),
                        close: valibot.optional(
                            valibot.object({
                                day: valibot.optional(valibot.number()),
                                hour: valibot.optional(valibot.number()),
                                minute: valibot.optional(valibot.number()),
                            }),
                        ),
                    }),
                ),
            ),
            weekdayDescriptions: valibot.optional(valibot.array(valibot.string())),
        }),
    ),
})

const googlePlacesSearchSchema = valibot.object({
    places: valibot.optional(
        valibot.array(
            valibot.object({
                id: valibot.optional(valibot.string()),
                location: valibot.optional(
                    valibot.object({
                        latitude: valibot.optional(valibot.number()),
                        longitude: valibot.optional(valibot.number()),
                    }),
                ),
            }),
        ),
    ),
})

function hasGoogleApiKey(apiKey: string | undefined): apiKey is string {
    return apiKey !== undefined && apiKey !== ""
}

type GoogleOpeningHours = NonNullable<valibot.InferOutput<typeof googleOpeningHoursSchema>["currentOpeningHours"]>

function openFallback(): OpeningHoursData {
    return { openState: "unknown", periods: [], weekdayText: [] }
}

function toOpenState(openNow: boolean | undefined): OpeningHoursData["openState"] {
    if (openNow === true) {
        return "open"
    }
    if (openNow === false) {
        return "closed"
    }
    return "unknown"
}

async function fetchCurrentOpeningHours(placeId: string, apiKey: string): Promise<GoogleOpeningHours | undefined> {
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
            return undefined
        }

        const data = valibot.parse(googleOpeningHoursSchema, await response.json())
        console.log("fetchOpeningHoursFromGoogle: Result:", JSON.stringify(data.currentOpeningHours))
        return data.currentOpeningHours ?? undefined
    } catch (err) {
        console.log("fetchOpeningHoursFromGoogle: Catch error:", err)
        return undefined
    }
}

function formatTimeOfDay(hour: number | undefined, minute: number | undefined): string {
    return `${(hour ?? 0).toString().padStart(2, "0")}:${(minute ?? 0).toString().padStart(2, "0")}`
}

function toOpeningHoursData(google: GoogleOpeningHours): OpeningHoursData {
    const periods: OpeningHoursData["periods"] = []
    const seenDays = new Set<number>()

    for (const period of google.periods ?? []) {
        const day = period.open?.day
        if (day === undefined || seenDays.has(day)) {
            continue
        }
        periods.push({
            day,
            openTime: formatTimeOfDay(period.open?.hour, period.open?.minute),
            closeTime: formatTimeOfDay(period.close?.hour, period.close?.minute),
        })
        seenDays.add(day)
    }

    return {
        openState: toOpenState(google.openNow),
        periods,
        weekdayText: google.weekdayDescriptions ?? [],
    }
}

async function fetchOpeningHoursFromGoogle(placeId: string): Promise<OpeningHoursData> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!hasGoogleApiKey(apiKey)) {
        console.log("fetchOpeningHoursFromGoogle: No API key")
        return openFallback()
    }

    const google = await fetchCurrentOpeningHours(placeId, apiKey)
    if (google === undefined) {
        return openFallback()
    }
    return toOpeningHoursData(google)
}

type DbGet = {
    get: (id: Id<"restaurants">) => Promise<Doc<"restaurants"> | null>
}

type AuthCtx = {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}

export async function requireOwnedRestaurant(
    ctx: AuthCtx & { db: DbGet },
    id: Id<"restaurants">,
): Promise<Doc<"restaurants">> {
    const userId = await requireUserId(ctx)
    const restaurant = await ctx.db.get(id)
    if (!restaurant) {
        throw new Error("Restaurant not found")
    }
    if (restaurant.ownerId !== userId) {
        throw new Error("Unauthorized: only the owner can change this restaurant")
    }
    return restaurant
}

export const _getRestaurantById = internalQuery({
    args: { id: v.id("restaurants") },
    handler: async (ctx, { id }) => ctx.db.get(id),
})

export const _profileNameByAuthUser = internalQuery({
    args: { authUserId: v.string() },
    handler: async (ctx, { authUserId }) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
            .unique()
        return profile?.name ?? FALLBACK_DISPLAY_NAME
    },
})

export const _patchRestaurant = internalMutation({
    args: {
        id: v.id("restaurants"),
        enrichment: v.optional(enrichmentValidator),
    },
    handler: async (ctx, { id, enrichment }) => {
        const restaurant = await ctx.db.get(id)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        await ctx.db.patch(id, {
            address: { label: restaurant.address.label, ...(enrichment !== undefined ? { enrichment } : {}) },
        })
    },
})

export const _insertRestaurant = internalMutation({
    args: {
        ownerId: v.string(),
        ownerName: v.string(),
        name: v.string(),
        cuisine: v.string(),
        address: v.object({
            label: v.string(),
            enrichment: v.optional(enrichmentValidator),
        }),
        details: v.optional(
            v.object({
                notes: v.optional(v.string()),
                link: v.optional(v.string()),
            }),
        ),
        images: v.array(restaurantImageValidator),
    },
    handler: async (ctx, args) =>
        ctx.db.insert("restaurants", { ...args, visibility: "private", createdAt: Date.now() }),
})

type GooglePlaceResult = {
    placeId?: string | undefined
    lat?: number | undefined
    lng?: number | undefined
}

async function lookupPlaceIdFromGoogle(name: string, location: string): Promise<GooglePlaceResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!hasGoogleApiKey(apiKey)) {
        console.log("lookupPlaceIdFromGoogle: No API key")
        return {}
    }

    try {
        const searchQuery = `${name}, ${location}`
        console.log("lookupPlaceIdFromGoogle: Searching for:", searchQuery)

        const response = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
            method: "POST",
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.id,places.location",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ textQuery: searchQuery }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.log("lookupPlaceIdFromGoogle: API error:", response.status, errorText)
            return {}
        }

        const data = valibot.parse(googlePlacesSearchSchema, await response.json())
        console.log("lookupPlaceIdFromGoogle: Result:", JSON.stringify(data))

        const place = data.places?.[0]
        return {
            ...(place?.id !== undefined ? { placeId: place.id } : {}),
            ...(place?.location?.latitude !== undefined ? { lat: place.location.latitude } : {}),
            ...(place?.location?.longitude !== undefined ? { lng: place.location.longitude } : {}),
        }
    } catch (err) {
        console.log("lookupPlaceIdFromGoogle: Catch error:", err)
        return {}
    }
}

type Coords = {
    lat: number
    lng: number
}

type DetailsFields = {
    notes?: string | undefined
    link?: string | undefined
}

type DetailsDoc = Doc<"restaurants">["details"]

type EnrichmentDoc = Doc<"restaurants">["address"]["enrichment"]

function nonEmptyText(value: string | undefined): string | undefined {
    return value !== undefined && value !== "" ? value : undefined
}

function cleanDetails(input: DetailsFields): DetailsDoc {
    const notes = nonEmptyText(input.notes)
    const link = nonEmptyText(input.link)
    if (notes === undefined && link === undefined) {
        return undefined
    }
    return { ...(notes !== undefined ? { notes } : {}), ...(link !== undefined ? { link } : {}) }
}

function mergeDetails(existing: DetailsDoc, input: DetailsFields): DetailsDoc {
    if (input.notes === undefined && input.link === undefined) {
        return existing
    }
    return cleanDetails({
        notes: input.notes ?? existing?.notes,
        link: input.link ?? existing?.link,
    })
}

type UpdateArgs = {
    name?: string | undefined
    cuisine?: string | undefined
    addressLabel?: string | undefined
    coords?: Coords | undefined
    notes?: string | undefined
    link?: string | undefined
    rating?: number | undefined
    images?: { url: string; storageId: string }[] | undefined
    visibility?: "private" | "shared" | undefined
}

function buildRestaurantPatch(
    restaurant: Doc<"restaurants">,
    args: Readonly<UpdateArgs>,
    details: DetailsDoc,
    enrichment: EnrichmentDoc,
): Record<string, unknown> {
    return {
        ...(args.name !== undefined ? { name: args.name } : {}),
        ...(args.cuisine !== undefined ? { cuisine: args.cuisine } : {}),
        ...(args.addressLabel !== undefined || args.coords !== undefined
            ? {
                  address: {
                      label: args.addressLabel ?? restaurant.address.label,
                      ...(enrichment !== undefined ? { enrichment } : {}),
                  },
              }
            : {}),
        ...(details !== undefined ? { details } : {}),
        ...(args.rating !== undefined ? { rating: args.rating } : {}),
        ...(args.images !== undefined ? { images: args.images } : {}),
        ...(args.visibility !== undefined ? { visibility: args.visibility } : {}),
    }
}
function buildEnrichment(parts: {
    placeId?: string | undefined
    coords?: Coords | undefined
    openingHours?: OpeningHoursData | undefined
}): EnrichmentDoc {
    const { placeId, coords, openingHours } = parts
    if (placeId === undefined && coords === undefined && openingHours === undefined) {
        return undefined
    }
    return {
        ...(placeId !== undefined ? { placeId } : {}),
        ...(coords !== undefined ? { coords } : {}),
        ...(openingHours !== undefined ? { openingHours } : {}),
    }
}

function mergeEnrichment(existing: EnrichmentDoc, coords: Coords | undefined): EnrichmentDoc {
    if (coords === undefined) {
        return existing
    }
    return buildEnrichment({
        placeId: existing?.placeId,
        coords,
        openingHours: existing?.openingHours,
    })
}

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        return ctx.db
            .query("restaurants")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .collect()
    },
})

export const getById = query({
    args: {
        id: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }
        const restaurant = await ctx.db.get(args.id)
        if (!restaurant) {
            return null
        }
        const visible = await isRestaurantVisibleTo(ctx.db, identity.subject, restaurant)
        return visible ? restaurant : null
    },
})

export const addWithOpeningHours = action({
    args: {
        name: v.string(),
        cuisine: v.string(),
        addressLabel: v.string(),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        coords: v.optional(coordsValidator),
        images: v.optional(v.array(restaurantImageValidator)),
    },
    handler: async (ctx, args): Promise<Id<"restaurants">> => {
        const userId = await requireUserId(ctx)
        const images = args.images ?? []
        assertImageLimit(images)

        const google = await lookupPlaceIdFromGoogle(args.name, args.addressLabel)
        console.log("addWithOpeningHours: Google result:", JSON.stringify(google))

        const coords =
            google.lat !== undefined && google.lng !== undefined
                ? { lat: google.lat, lng: google.lng }
                : (args.coords ?? undefined)

        let openingHours: OpeningHoursData | undefined
        if (google.placeId !== undefined && google.placeId !== "") {
            openingHours = await fetchOpeningHoursFromGoogle(google.placeId)
        }

        const enrichment = buildEnrichment({ placeId: google.placeId, coords, openingHours })
        const ownerName = await ctx.runQuery(internal.restaurants._profileNameByAuthUser, { authUserId: userId })
        const details = cleanDetails({ notes: args.notes, link: args.link })
        return ctx.runMutation(internal.restaurants._insertRestaurant, {
            ownerId: userId,
            ownerName,
            name: args.name,
            cuisine: args.cuisine,
            address: {
                label: args.addressLabel,
                ...(enrichment !== undefined ? { enrichment } : {}),
            },
            ...(details !== undefined ? { details } : {}),
            images,
        })
    },
})

export const update = mutation({
    args: {
        id: v.id("restaurants"),
        name: v.optional(v.string()),
        cuisine: v.optional(v.string()),
        addressLabel: v.optional(v.string()),
        coords: v.optional(coordsValidator),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        rating: v.optional(v.number()),
        images: v.optional(v.array(restaurantImageValidator)),
        visibility: v.optional(v.union(v.literal("private"), v.literal("shared"))),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.id)

        if (args.images !== undefined) {
            assertImageLimit(args.images)
        }

        const details = mergeDetails(restaurant.details, { notes: args.notes, link: args.link })
        const enrichment = mergeEnrichment(restaurant.address.enrichment, args.coords)

        await ctx.db.patch(args.id, buildRestaurantPatch(restaurant, args, details, enrichment))
    },
})

export const remove = mutation({
    args: {
        id: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.id)

        for (const img of restaurant.images) {
            try {
                const owner = await ctx.runQuery(internal.uploads.ownerByStorage, { storageId: img.storageId })
                if (owner !== null && owner !== restaurant.ownerId) {
                    continue
                }
                await ctx.storage.delete(asStorageId(img.storageId))
                await ctx.runMutation(internal.uploads.removeRecord, { storageId: img.storageId })
            } catch (error) {
                console.warn("Failed to delete orphaned image:", img.storageId, error)
            }
        }

        await ctx.db.delete(args.id)
    },
})

export const deleteImage = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        imageUrl: v.string(),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.restaurantId)

        const entry = restaurant.images.find((img) => img.storageId === args.storageId)
        if (!entry || entry.url !== args.imageUrl) {
            throw new Error("Storage ID is not part of this restaurant")
        }

        const owner = await ctx.runQuery(internal.uploads.ownerByStorage, { storageId: args.storageId })
        if (owner !== null && owner !== restaurant.ownerId) {
            throw new Error("Unauthorized: storage does not belong to you")
        }

        await ctx.storage.delete(asStorageId(args.storageId))
        await ctx.runMutation(internal.uploads.removeRecord, { storageId: args.storageId })

        const updatedImages = restaurant.images.filter((img) => img.storageId !== args.storageId)
        if (updatedImages.length !== restaurant.images.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const cleanupStorage = mutation({
    args: {
        restaurantId: v.optional(v.id("restaurants")),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Unauthorized: authentication required")
        }

        if (args.restaurantId === undefined) {
            const owner = await ctx.runQuery(internal.uploads.ownerByStorage, { storageId: args.storageId })
            if (owner === null || owner !== identity.subject) {
                throw new Error("Unauthorized: storage does not belong to you")
            }
            await ctx.storage.delete(asStorageId(args.storageId))
            await ctx.runMutation(internal.uploads.removeRecord, { storageId: args.storageId })
            return
        }

        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (restaurant.ownerId !== identity.subject) {
            throw new Error("Unauthorized: only the owner can change this restaurant")
        }

        const entry = restaurant.images.find((img) => img.storageId === args.storageId)
        if (!entry) {
            throw new Error("Storage ID is not part of this restaurant")
        }

        const owner = await ctx.runQuery(internal.uploads.ownerByStorage, { storageId: args.storageId })
        if (owner !== null && owner !== restaurant.ownerId) {
            throw new Error("Unauthorized: storage does not belong to you")
        }

        await ctx.storage.delete(asStorageId(args.storageId))
        await ctx.runMutation(internal.uploads.removeRecord, { storageId: args.storageId })

        const updatedImages = restaurant.images.filter((img) => img.storageId !== args.storageId)
        if (updatedImages.length !== restaurant.images.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const refreshOpeningHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.runQuery(internal.restaurants._getRestaurantById, { id: restaurantId })
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (restaurant.ownerId !== userId) {
            throw new Error("Unauthorized: only the owner can change this restaurant")
        }

        const placeId = restaurant.address.enrichment?.placeId
        if (placeId === undefined || placeId === "") {
            throw new Error("No placeId to refresh")
        }

        const openingHours = await fetchOpeningHoursFromGoogle(placeId)
        await ctx.runMutation(internal.restaurants._patchRestaurant, {
            id: restaurantId,
            enrichment: { ...restaurant.address.enrichment, openingHours },
        })
    },
})

export const lookupPlaceIdAndHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        console.log("lookupPlaceIdAndHours: Starting for restaurantId:", restaurantId)
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.runQuery(internal.restaurants._getRestaurantById, { id: restaurantId })
        if (!restaurant) {
            console.log("lookupPlaceIdAndHours: Restaurant not found")
            throw new Error("Restaurant not found")
        }
        if (restaurant.ownerId !== userId) {
            throw new Error("Unauthorized: only the owner can change this restaurant")
        }

        console.log("lookupPlaceIdAndHours: Restaurant:", restaurant.name, restaurant.address.label)

        if (!restaurant.name || !restaurant.address.label) {
            console.log("lookupPlaceIdAndHours: Missing name or location")
            throw new Error("Name and location required to lookup")
        }

        const google = await lookupPlaceIdFromGoogle(restaurant.name, restaurant.address.label)
        console.log("lookupPlaceIdAndHours: Google result:", JSON.stringify(google))

        if (google.placeId === undefined || google.placeId === "") {
            console.log("lookupPlaceIdAndHours: No placeId found, returning")
            return
        }

        console.log("lookupPlaceIdAndHours: Fetching opening hours...")
        const openingHours = await fetchOpeningHoursFromGoogle(google.placeId)
        console.log("lookupPlaceIdAndHours: Got openingHours:", JSON.stringify(openingHours))

        const coords =
            google.lat !== undefined && google.lng !== undefined
                ? { lat: google.lat, lng: google.lng }
                : (restaurant.address.enrichment?.coords ?? undefined)
        await ctx.runMutation(internal.restaurants._patchRestaurant, {
            id: restaurantId,
            enrichment: {
                placeId: google.placeId,
                ...(coords !== undefined ? { coords } : {}),
                openingHours,
            },
        })
        console.log("lookupPlaceIdAndHours: Done!")
    },
})
