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
import { query, mutation, action, internalQuery, internalMutation, type MutationCtx } from "./_generated/server"
import { googleMapsApiKey } from "./env"
import { requireOwnedRestaurant, formatDisplayName, adjustStatsCounters, requireUserId } from "./helpers"
import { coordsValidator, enrichmentValidator, openingHoursValidator, restaurantImageValidator } from "./validators"
import { isRestaurantVisibleTo } from "./visibility"

type OpeningHoursData = Infer<typeof openingHoursValidator>

function assertImageLimit(images: ReadonlyArray<unknown>): void {
    if (images.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed`)
    }
}

type UploadRecord = {
    ownerId: string
    restaurantId: Id<"restaurants"> | null
    mimeType: string | null
    byteSize: number | null
} | null

// Fail-closed ownership: a missing record and a foreign record both reject with the same
// message so callers cannot probe which storage IDs exist.
function requireUploadOwner(record: UploadRecord, ownerId: string): asserts record {
    if (!record || record.ownerId !== ownerId) {
        throw new Error("Unauthorized: storage does not belong to you")
    }
}

// Attach requires a server ownership record matching the caller and no conflicting resource
// association. allowId is the restaurant being written (null while adding, before it exists).
function assertAttachable(record: UploadRecord, ownerId: string, allowId: Id<"restaurants"> | null): asserts record {
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

// Server-derived attribution: ownership, display name, URL, MIME type, and
// byte size come from the upload record, profile, and storage system, never
// from client-claimed fields. Client-reported dimensions pass through as
// untrusted display hints.
function withServerMetadata(
    image: ImageInput,
    owner: Readonly<{ ownerId: string; displayName: string }>,
    record: NonNullable<UploadRecord>,
    url: string,
): {
    url: string
    storageId: Id<"_storage">
    ownerId: string
    displayName: string
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
        ownerId: owner.ownerId,
        displayName: owner.displayName,
        ...(record.mimeType !== null ? { mimeType: record.mimeType } : {}),
        ...(record.byteSize !== null ? { byteSize: record.byteSize } : {}),
    }
}

// Delete one image that the restaurant document claims. Verifies the server-side ownership
// record (never the client-written entry) and the resource association, then removes the
// blob, its record, and the entry. Returns the surviving entries for the caller to patch.
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

export const _profileNameByAuthUser = internalQuery({
    args: { authUserId: v.string() },
    handler: async (ctx, { authUserId }) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
            .unique()
        return formatDisplayName(profile?.name)
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
        clientMutationId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ restaurantId: Id<"restaurants">; duplicate: boolean }> => {
        // Idempotency lives inside this mutation so concurrent same-key inserts serialize: the
        // second call sees the first call's dedupe row and returns the existing id instead of a
        // second document.
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
            createdAt: Date.now(),
        })
        if (mutationKey !== undefined) {
            await ctx.db.insert("clientMutations", {
                key: mutationKey,
                userId: args.ownerId,
                restaurantId,
                createdAt: Date.now(),
            })
        }
        await adjustStatsCounters(ctx, { restaurants: 1, cuisines: { [args.cuisine]: 1 } })
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
    rating?: number | undefined
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
    // Null for anon, missing, and invisible alike: strangers learn nothing, not even whether
    // the id exists.
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

const FEED_LIMIT = 30
const FEED_FRIEND_CAP = 50
const FEED_PER_OWNER_TAKE = 50

export const feed = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)

        const friendships = await ctx.db
            .query("friendships")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .take(FEED_FRIEND_CAP * 2)
        const candidateIds = new Set(
            friendships.filter((row) => row.status === "accepted").map((row) => row.friendAuthUserId),
        )
        candidateIds.delete(userId)

        const discoveries: Doc<"restaurants">[] = []
        let checked = 0
        for (const ownerId of candidateIds) {
            if (checked >= FEED_FRIEND_CAP) {
                break
            }
            checked += 1
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
        return discoveries.toSorted((a, b) => b._creationTime - a._creationTime).slice(0, FEED_LIMIT)
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
        placeId: v.optional(v.string()),
        images: v.optional(v.array(restaurantImageValidator)),
        clientMutationId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<Id<"restaurants">> => {
        const userId = await requireUserId(ctx)
        assertRestaurantText(args)
        const images = args.images ?? []
        assertImageLimit(images)
        const attachable: { image: ImageInput; record: NonNullable<UploadRecord> }[] = []
        for (const img of images) {
            const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: img.storageId })
            assertAttachable(record, userId, null)
            attachable.push({ image: img, record })
        }

        // A client-held placeId (from the Places picker) wins over the
        // name/address guess: the user already confirmed the exact place.
        const providedPlaceId = args.placeId !== undefined && args.placeId !== "" ? args.placeId : undefined
        const google =
            providedPlaceId !== undefined
                ? { placeId: providedPlaceId, lat: undefined, lng: undefined }
                : await lookupPlaceIdFromGoogle(args.name, args.addressLabel)

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
        const enrichedImages = await Promise.all(
            attachable.map(async ({ image, record }) => {
                const url =
                    (await ctx.storage.getUrl(image.storageId)) ??
                    images.find((candidate) => candidate.storageId === image.storageId)?.url
                if (url === undefined) {
                    throw new Error("Uploaded image is missing its URL")
                }
                return withServerMetadata(image, { ownerId: userId, displayName: ownerName }, record, url)
            }),
        )
        const { restaurantId, duplicate } = await ctx.runMutation(internal.restaurants._insertRestaurant, {
            ownerId: userId,
            ownerName,
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
        // A duplicate retry returns the first call's id; its images are already attached.
        if (!duplicate) {
            for (const img of enrichedImages) {
                await ctx.runMutation(internal.uploads.attach, {
                    storageId: img.storageId,
                    ownerId: userId,
                    restaurantId,
                })
            }
        }
        return restaurantId
    },
})

// Reconciles a submitted image list against the stored restaurant: keeps
// already-attached entries untouched (with their stored metadata), enriches
// genuinely new uploads with server-derived identity, attaches them, and
// detaches removed ones. Returns the merged list to persist.
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
    const ownerName = await ctx.runQuery(internal.restaurants._profileNameByAuthUser, {
        authUserId: restaurant.ownerId,
    })
    for (const { image, record, url } of fresh) {
        const enriched = withServerMetadata(image, { ownerId: restaurant.ownerId, displayName: ownerName }, record, url)
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
        rating: v.optional(v.number()),
        images: v.optional(v.array(restaurantImageValidator)),
        visibility: v.optional(v.union(v.literal("private"), v.literal("shared"))),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.id)

        if (args.rating !== undefined && (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 7)) {
            throw new Error("Rating must be a whole number between 1 and 7")
        }
        assertRestaurantText(args)

        const details = mergeDetails(restaurant.details, { notes: args.notes, link: args.link })
        const enrichment = mergeEnrichment(restaurant.address.enrichment, args.coords)
        if (args.cuisine !== undefined && args.cuisine !== restaurant.cuisine) {
            await adjustStatsCounters(ctx, { cuisines: { [restaurant.cuisine]: -1, [args.cuisine]: 1 } })
        }

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
        const restaurant = await requireOwnedRestaurant(ctx, args.id)

        // Fail-closed per blob: only storage with a server record owned by the restaurant owner
        // is deleted, and never when the record associates the blob with another restaurant.
        // Foreign, unrecorded, or elsewhere-attached blobs are left untouched (never deleted on
        // the basis of a client-written image entry) while the restaurant document itself is
        // removed. Rejecting the whole removal here would brick deletes of restaurants that
        // reference legacy or orphaned images.
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
        await adjustStatsCounters(ctx, { restaurants: -1, cuisines: { [restaurant.cuisine]: -1 } })
    },
})

export const deleteImage = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        imageUrl: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.restaurantId)

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
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Unauthorized: authentication required")
        }

        if (args.restaurantId === undefined) {
            const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: args.storageId })
            requireUploadOwner(record, identity.subject)
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
        if (restaurant.ownerId !== identity.subject) {
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
        const userId = await requireUserId(ctx)
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

export const addVisitMemory = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        images: v.array(restaurantImageValidator),
    },
    handler: async (ctx, args): Promise<Id<"visitMemories">> => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (!(await isRestaurantVisibleTo(ctx.db, userId, restaurant))) {
            throw new Error("Restaurant is not visible to you")
        }
        assertImageLimit(args.images)
        if (args.images.length === 0) {
            throw new Error("Add at least one photo")
        }
        const displayName = await ctx.runQuery(internal.restaurants._profileNameByAuthUser, { authUserId: userId })
        const enrichedImages = []
        for (const img of args.images) {
            const record = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId: img.storageId })
            assertAttachable(record, userId, args.restaurantId)
            const url = (await ctx.storage.getUrl(img.storageId)) ?? img.url
            enrichedImages.push(withServerMetadata(img, { ownerId: userId, displayName }, record, url))
        }
        const memoryId = await ctx.db.insert("visitMemories", {
            restaurantId: args.restaurantId,
            userId,
            displayName,
            images: enrichedImages,
            createdAt: Date.now(),
        })
        for (const img of enrichedImages) {
            await ctx.runMutation(internal.uploads.attach, {
                storageId: img.storageId,
                ownerId: userId,
                restaurantId: args.restaurantId,
            })
        }
        return memoryId
    },
})

export const listVisitMemories = query({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            return []
        }
        if (!(await isRestaurantVisibleTo(ctx.db, identity.subject, restaurant))) {
            return []
        }
        return ctx.db
            .query("visitMemories")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .order("desc")
            .take(30)
    },
})
