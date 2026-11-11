import { v, type Infer } from "convex/values"
import * as valibot from "valibot"

import { MAX_IMAGES } from "../src/core/constants"
import {
    cleanDetails,
    mergeDetails,
    mergeEnrichment,
    type Coords,
    type DetailsDoc,
    type Enrichment,
} from "../src/core/restaurant.details"
import { internal } from "./_generated/api"
import { type Doc, type Id } from "./_generated/dataModel"
import {
    query,
    mutation,
    action,
    internalQuery,
    internalMutation,
    type ActionCtx,
    type MutationCtx,
} from "./_generated/server"
import { googleMapsApiKey } from "./env"
import { requireOwnedRestaurant, withOwnerNames } from "./helpers"
import { requireProfile, signedInProfile, viewerProfile } from "./model/identity/profiles"
import { friendIds } from "./model/social/friendships"
import { coordsValidator, enrichmentValidator, openingHoursValidator, restaurantImageValidator } from "./validators"
import { isRestaurantVisibleTo } from "./visibility"

type OpeningHoursData = Infer<typeof openingHoursValidator>

function assertImageLimit(images: ReadonlyArray<unknown>): void {
    if (images.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
    }
}

type ProfileId = Id<"profiles">

async function requireActionProfile(ctx: ActionCtx): Promise<ProfileId> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    const profileId = await ctx.runQuery(internal.identity._viewerProfileId, {})
    if (profileId === null) {
        throw new Error("Unauthorized: profile required")
    }
    return profileId
}

type UploadRecord = {
    ownerId: ProfileId
    restaurantId: Id<"restaurants"> | null
    mimeType: string | null
    byteSize: number | null
} | null

// See ADR-0015: ownership comes from the server record.
function requireUploadOwner(record: UploadRecord, ownerId: ProfileId): asserts record {
    if (!record || record.ownerId !== ownerId) {
        throw new Error("Unauthorized: storage does not belong to you")
    }
}

function assertAttachable(record: UploadRecord, ownerId: ProfileId, allowId: Id<"restaurants"> | null): asserts record {
    requireUploadOwner(record, ownerId)
    if (record.restaurantId !== null && record.restaurantId !== allowId) {
        throw new Error("Storage is already attached to another restaurant")
    }
}

type ImageInput = {
    readonly storageId: Id<"_storage">
    readonly width?: number | undefined
    readonly height?: number | undefined
}

// See ADR-0015: attribution comes from the server record.
function withServerMetadata(
    image: ImageInput,
    ownerId: ProfileId,
    record: NonNullable<UploadRecord>,
    url: string,
): {
    url: string
    storageId: Id<"_storage">
    ownerId: ProfileId
    mimeType?: string
    byteSize?: number
    width?: number
    height?: number
} {
    return {
        url,
        storageId: image.storageId,
        ...(image.width !== undefined ? { width: image.width } : {}),
        ...(image.height !== undefined ? { height: image.height } : {}),
        ownerId,
        ...(record.mimeType !== null ? { mimeType: record.mimeType } : {}),
        ...(record.byteSize !== null ? { byteSize: record.byteSize } : {}),
    }
}

// See ADR-0015: verify server record, then remove blob and entry.
async function deleteAttachedImage(
    ctx: MutationCtx,
    restaurant: Doc<"restaurants">,
    storageId: Id<"_storage">,
): Promise<Doc<"restaurants">["images"]> {
    const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId })
    requireUploadOwner(record, restaurant.ownerId)
    if (record.restaurantId !== null && record.restaurantId !== restaurant._id) {
        throw new Error("Storage ID is not part of this restaurant")
    }
    await ctx.storage.delete(storageId)
    await ctx.runMutation(internal.uploads.removeRecord, { storageId })
    return restaurant.images.filter((img) => img.storageId !== storageId)
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
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=currentOpeningHours`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "currentOpeningHours",
            },
        })

        if (!response.ok) {
            await response.text()
            return undefined
        }

        const data = valibot.parse(googleOpeningHoursSchema, await response.json())
        return data.currentOpeningHours ?? undefined
    } catch {
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
    const apiKey = googleMapsApiKey()
    if (apiKey === undefined) {
        return openFallback()
    }

    const google = await fetchCurrentOpeningHours(placeId, apiKey)
    if (google === undefined) {
        return openFallback()
    }
    return toOpeningHoursData(google)
}

export const _getRestaurantById = internalQuery({
    args: { id: v.id("restaurants") },
    handler: async (ctx, { id }) => ctx.db.get(id),
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
        ownerId: v.id("profiles"),
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
        clientMutationId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ restaurantId: Id<"restaurants">; duplicate: boolean }> => {
        // See ADR-0002: same key serializes, returns existing id.
        const mutationKey = args.clientMutationId
        if (mutationKey !== undefined) {
            const prior = await ctx.db
                .query("clientMutations")
                .withIndex("by_user_key", (q) => q.eq("userId", args.ownerId).eq("key", mutationKey))
                .unique()
            if (prior) {
                return { restaurantId: prior.restaurantId, duplicate: true }
            }
        }
        const { clientMutationId: _dedupeKey, ...doc } = args
        const restaurantId = await ctx.db.insert("restaurants", {
            ...doc,
            ...(mutationKey !== undefined ? { clientMutationId: mutationKey } : {}),
            visibility: "private",
        })
        if (mutationKey !== undefined) {
            await ctx.db.insert("clientMutations", {
                key: mutationKey,
                userId: args.ownerId,
                restaurantId,
            })
        }
        return { restaurantId, duplicate: false }
    },
})

type GooglePlaceResult = {
    placeId?: string | undefined
    lat?: number | undefined
    lng?: number | undefined
}

async function lookupPlaceIdFromGoogle(name: string, location: string): Promise<GooglePlaceResult> {
    const apiKey = googleMapsApiKey()
    if (apiKey === undefined) {
        return {}
    }

    try {
        const searchQuery = `${name}, ${location}`

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
            await response.text()
            return {}
        }

        const data = valibot.parse(googlePlacesSearchSchema, await response.json())

        const place = data.places?.[0]
        return {
            ...(place?.id !== undefined ? { placeId: place.id } : {}),
            ...(place?.location?.latitude !== undefined ? { lat: place.location.latitude } : {}),
            ...(place?.location?.longitude !== undefined ? { lng: place.location.longitude } : {}),
        }
    } catch {
        return {}
    }
}

type EnrichmentDoc = Enrichment<OpeningHoursData>

type UpdateArgs = {
    name?: string | undefined
    cuisine?: string | undefined
    addressLabel?: string | undefined
    coords?: Coords | undefined
    notes?: string | undefined
    link?: string | undefined
    images?: { url: string; storageId: Id<"_storage"> }[] | undefined
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

export const get = query({
    args: {},
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        const owned = await ctx.db
            .query("restaurants")
            .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
            .collect()
        return withOwnerNames(ctx.db, owned)
    },
})

export const getById = query({
    // See ADR-0004: null for missing or invisible.
    args: {
        id: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const me = await viewerProfile(ctx)
        if (!me) {
            return null
        }
        const restaurant = await ctx.db.get(args.id)
        if (!restaurant || !(await isRestaurantVisibleTo(ctx.db, me._id, restaurant))) {
            return null
        }
        const [view] = await withOwnerNames(ctx.db, [restaurant])
        return view ?? null
    },
})

const FEED_LIMIT = 30
const FEED_FRIEND_CAP = 50
const FEED_PER_OWNER_TAKE = 50

export const feed = query({
    args: {},
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        const userId = me._id

        const discoveries: Doc<"restaurants">[] = []
        for (const ownerId of await friendIds(ctx.db, userId, FEED_FRIEND_CAP)) {
            const owned = await ctx.db
                .query("restaurants")
                .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
                .order("desc")
                .take(FEED_PER_OWNER_TAKE)
            for (const restaurant of owned) {
                if (await isRestaurantVisibleTo(ctx.db, userId, restaurant)) {
                    discoveries.push(restaurant)
                }
            }
        }
        return withOwnerNames(
            ctx.db,
            discoveries.toSorted((a, b) => b._creationTime - a._creationTime).slice(0, FEED_LIMIT),
        )
    },
})

type AttachableUpload = {
    readonly image: ImageInput
    readonly record: NonNullable<UploadRecord>
}

type SubmittedImage = Infer<typeof restaurantImageValidator>

async function collectAttachableUploads(
    ctx: ActionCtx,
    userId: ProfileId,
    images: ReadonlyArray<SubmittedImage>,
): Promise<AttachableUpload[]> {
    const attachable: AttachableUpload[] = []
    for (const img of images) {
        const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: img.storageId })
        assertAttachable(record, userId, null)
        attachable.push({ image: img, record })
    }
    return attachable
}

async function resolveGooglePlace(
    name: string,
    addressLabel: string,
    placeId: string | undefined,
): Promise<GooglePlaceResult> {
    const providedPlaceId = placeId !== undefined && placeId !== "" ? placeId : undefined
    if (providedPlaceId !== undefined) {
        return { placeId: providedPlaceId, lat: undefined, lng: undefined }
    }
    return lookupPlaceIdFromGoogle(name, addressLabel)
}

function resolveCoords(
    google: GooglePlaceResult,
    fallback: { lat: number; lng: number } | undefined,
): { lat: number; lng: number } | undefined {
    if (google.lat !== undefined && google.lng !== undefined) {
        return { lat: google.lat, lng: google.lng }
    }
    return fallback
}

async function resolveOpeningHours(placeId: string | undefined): Promise<OpeningHoursData | undefined> {
    if (placeId === undefined || placeId === "") {
        return undefined
    }
    return fetchOpeningHoursFromGoogle(placeId)
}

async function enrichAttachedImages(
    ctx: ActionCtx,
    attachable: ReadonlyArray<AttachableUpload>,
    images: ReadonlyArray<SubmittedImage>,
    userId: ProfileId,
): Promise<ReturnType<typeof withServerMetadata>[]> {
    return Promise.all(
        attachable.map(async ({ image, record }) => {
            const url =
                (await ctx.storage.getUrl(image.storageId)) ??
                images.find((candidate) => candidate.storageId === image.storageId)?.url
            if (url === undefined) {
                throw new Error("Uploaded image is missing its URL")
            }
            return withServerMetadata(image, userId, record, url)
        }),
    )
}

async function attachInsertedImages(
    ctx: ActionCtx,
    enrichedImages: ReadonlyArray<ReturnType<typeof withServerMetadata>>,
    userId: ProfileId,
    restaurantId: Id<"restaurants">,
): Promise<void> {
    for (const img of enrichedImages) {
        await ctx.runMutation(internal.uploads.attach, {
            storageId: img.storageId,
            ownerId: userId,
            restaurantId,
        })
    }
}

export const addWithOpeningHours = action({
    args: {
        name: v.string(),
        cuisine: v.string(),
        addressLabel: v.string(),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        coords: v.optional(coordsValidator),
        placeId: v.optional(v.string()),
        images: v.optional(v.array(restaurantImageValidator)),
        clientMutationId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<Id<"restaurants">> => {
        const userId = await requireActionProfile(ctx)
        assertRestaurantText(args)
        const images = args.images ?? []
        assertImageLimit(images)
        const attachable = await collectAttachableUploads(ctx, userId, images)

        const google = await resolveGooglePlace(args.name, args.addressLabel, args.placeId)
        const coords = resolveCoords(google, args.coords ?? undefined)
        const openingHours = await resolveOpeningHours(google.placeId)

        const enrichment = buildEnrichment({ placeId: google.placeId, coords, openingHours })
        const details = cleanDetails({ notes: args.notes, link: args.link })
        const enrichedImages = await enrichAttachedImages(ctx, attachable, images, userId)
        const { restaurantId, duplicate } = await ctx.runMutation(internal.restaurants._insertRestaurant, {
            ownerId: userId,
            name: args.name,
            cuisine: args.cuisine,
            address: {
                label: args.addressLabel,
                ...(enrichment !== undefined ? { enrichment } : {}),
            },
            ...(details !== undefined ? { details } : {}),
            images: enrichedImages,
            ...(args.clientMutationId !== undefined ? { clientMutationId: args.clientMutationId } : {}),
        })
        if (!duplicate) {
            await attachInsertedImages(ctx, enrichedImages, userId, restaurantId)
        }
        return restaurantId
    },
})

// See ADR-0015: keep attached, enrich new, detach removed.
type FreshUpload = {
    image: ImageInput
    record: NonNullable<UploadRecord>
    url: string
}

async function collectFreshUploads(
    ctx: MutationCtx,
    restaurant: Doc<"restaurants">,
    inputs: ReadonlyArray<ImageInput & { url: string }>,
): Promise<FreshUpload[]> {
    const previousIds = new Set(restaurant.images.map((img) => img.storageId))
    const fresh: FreshUpload[] = []
    for (const img of inputs) {
        if (previousIds.has(img.storageId)) {
            continue
        }
        const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: img.storageId })
        assertAttachable(record, restaurant.ownerId, restaurant._id)
        const url = (await ctx.storage.getUrl(img.storageId)) ?? img.url
        fresh.push({ image: img, record, url })
    }
    return fresh
}

async function attachFreshUploads(
    ctx: MutationCtx,
    restaurant: Doc<"restaurants">,
    fresh: ReadonlyArray<FreshUpload>,
    storedById: Map<Id<"_storage">, Doc<"restaurants">["images"][number]>,
): Promise<void> {
    if (fresh.length === 0) {
        return
    }
    for (const { image, record, url } of fresh) {
        const enriched = withServerMetadata(image, restaurant.ownerId, record, url)
        storedById.set(image.storageId, enriched)
        await ctx.runMutation(internal.uploads.attach, {
            storageId: image.storageId,
            ownerId: restaurant.ownerId,
            restaurantId: restaurant._id,
        })
    }
}

async function detachRemovedUploads(
    ctx: MutationCtx,
    restaurant: Doc<"restaurants">,
    previousIds: ReadonlySet<Id<"_storage">>,
    nextIds: ReadonlySet<Id<"_storage">>,
): Promise<void> {
    for (const storageId of previousIds) {
        if (!nextIds.has(storageId)) {
            await ctx.runMutation(internal.uploads.detach, { storageId, ownerId: restaurant.ownerId })
        }
    }
}

async function syncRestaurantImages(
    ctx: MutationCtx,
    restaurant: Doc<"restaurants">,
    inputs: ReadonlyArray<ImageInput & { url: string }>,
): Promise<Doc<"restaurants">["images"]> {
    const previousIds = new Set(restaurant.images.map((img) => img.storageId))
    const nextIds = new Set(inputs.map((img) => img.storageId))
    const storedById = new Map(restaurant.images.map((img) => [img.storageId, img]))
    await attachFreshUploads(ctx, restaurant, await collectFreshUploads(ctx, restaurant, inputs), storedById)
    const merged: Doc<"restaurants">["images"] = []
    for (const img of inputs) {
        const kept = storedById.get(img.storageId)
        if (kept !== undefined) {
            merged.push(kept)
        }
    }
    await detachRemovedUploads(ctx, restaurant, previousIds, nextIds)
    return merged
}

function assertRestaurantText(
    args: Readonly<{ name?: string; cuisine?: string; addressLabel?: string; notes?: string; link?: string }>,
): void {
    if (args.name !== undefined && (args.name.trim() === "" || args.name.length > 120)) {
        throw new Error("Name must be 1-120 characters")
    }
    if (args.cuisine !== undefined && (args.cuisine.trim() === "" || args.cuisine.length > 80)) {
        throw new Error("Cuisine must be 1-80 characters")
    }
    if (args.addressLabel !== undefined && (args.addressLabel.trim() === "" || args.addressLabel.length > 200)) {
        throw new Error("Address must be 1-200 characters")
    }
    if (args.notes !== undefined && args.notes.length > 2000) {
        throw new Error("Notes must be at most 2000 characters")
    }
    if (args.link !== undefined && args.link.length > 2000) {
        throw new Error("Link must be at most 2000 characters")
    }
}

export const update = mutation({
    args: {
        id: v.id("restaurants"),
        name: v.optional(v.string()),
        cuisine: v.optional(v.string()),
        addressLabel: v.optional(v.string()),
        coords: v.optional(coordsValidator),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        images: v.optional(v.array(restaurantImageValidator)),
        visibility: v.optional(v.union(v.literal("private"), v.literal("shared"))),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx.db, args.id, (await requireProfile(ctx))._id)

        assertRestaurantText(args)

        const details = mergeDetails(restaurant.details, { notes: args.notes, link: args.link })
        const enrichment = mergeEnrichment(restaurant.address.enrichment, args.coords)

        if (args.images !== undefined) {
            const images = args.images
            assertImageLimit(images)
            const mergedImages = await syncRestaurantImages(ctx, restaurant, images)
            await ctx.db.patch(
                args.id,
                buildRestaurantPatch(restaurant, { ...args, images: mergedImages }, details, enrichment),
            )
            return
        }

        await ctx.db.patch(args.id, buildRestaurantPatch(restaurant, args, details, enrichment))
    },
})

export const remove = mutation({
    args: {
        id: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx.db, args.id, (await requireProfile(ctx))._id)

        // See ADR-0015: delete only owned, never foreign blobs.
        for (const img of restaurant.images) {
            try {
                const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: img.storageId })
                if (!record || record.ownerId !== restaurant.ownerId) {
                    console.warn("Skipping storage delete with missing or foreign ownership:", img.storageId)
                    continue
                }
                if (record.restaurantId !== null && record.restaurantId !== args.id) {
                    console.warn("Skipping storage delete attached to another restaurant:", img.storageId)
                    continue
                }
                await ctx.storage.delete(img.storageId)
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
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx.db, args.restaurantId, (await requireProfile(ctx))._id)

        const entry = restaurant.images.find((img) => img.storageId === args.storageId)
        if (!entry || entry.url !== args.imageUrl) {
            throw new Error("Storage ID is not part of this restaurant")
        }

        const updatedImages = await deleteAttachedImage(ctx, restaurant, args.storageId)
        if (updatedImages.length !== restaurant.images.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const cleanupStorage = mutation({
    args: {
        restaurantId: v.optional(v.id("restaurants")),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)

        if (args.restaurantId === undefined) {
            const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: args.storageId })
            requireUploadOwner(record, me._id)
            if (record.restaurantId !== null) {
                throw new Error("Storage is attached to a restaurant; remove it from the restaurant instead")
            }
            await ctx.storage.delete(args.storageId)
            await ctx.runMutation(internal.uploads.removeRecord, { storageId: args.storageId })
            return
        }

        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (restaurant.ownerId !== me._id) {
            throw new Error("Unauthorized: only the owner can change this restaurant")
        }

        const entry = restaurant.images.find((img) => img.storageId === args.storageId)
        if (!entry) {
            throw new Error("Storage ID is not part of this restaurant")
        }

        const updatedImages = await deleteAttachedImage(ctx, restaurant, args.storageId)
        if (updatedImages.length !== restaurant.images.length) {
            await ctx.db.patch(args.restaurantId, { images: updatedImages })
        }
    },
})

export const refreshOpeningHours = action({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, { restaurantId }) => {
        const userId = await requireActionProfile(ctx)
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
        const userId = await requireActionProfile(ctx)
        const restaurant = await ctx.runQuery(internal.restaurants._getRestaurantById, { id: restaurantId })
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (restaurant.ownerId !== userId) {
            throw new Error("Unauthorized: only the owner can change this restaurant")
        }

        if (!restaurant.name || !restaurant.address.label) {
            throw new Error("Name and location required to lookup")
        }

        const google = await lookupPlaceIdFromGoogle(restaurant.name, restaurant.address.label)

        if (google.placeId === undefined || google.placeId === "") {
            return
        }

        const openingHours = await fetchOpeningHoursFromGoogle(google.placeId)

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
    },
})
