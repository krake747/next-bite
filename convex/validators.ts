import { v } from "convex/values"

export const restaurantImageValidator = v.object({
    url: v.string(),
    storageId: v.id("_storage"),
    ownerId: v.optional(v.id("profiles")),
    mimeType: v.optional(v.string()),
    byteSize: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
})

export const photoInputValidator = v.object({
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
})

export const placeGoogleValidator = v.object({
    placeId: v.optional(v.string()),
    // Legacy: rows written before #227 carry coordinates. Relaxed per docs/migrations.md
    // so the push accepts stored data; the stripPlaceCoordinates backfill removes
    // these keys with replace, then this tightens to placeId only.
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
})

export const placeGoogleInputValidator = v.object({
    placeId: v.optional(v.string()),
})

export const placeLocationValidator = v.object({
    lat: v.number(),
    lng: v.number(),
})

export const placePhotoValidator = v.object({
    name: v.string(),
    widthPx: v.optional(v.number()),
    heightPx: v.optional(v.number()),
    authorDisplayName: v.optional(v.string()),
    authorUri: v.optional(v.string()),
    authorPhotoUri: v.optional(v.string()),
    flagContentUri: v.optional(v.string()),
    googleMapsUri: v.optional(v.string()),
})

export const editorialSummaryValidator = v.object({
    text: v.string(),
    languageCode: v.optional(v.string()),
})

export const reviewSummaryValidator = v.object({
    text: v.optional(v.string()),
    disclosureText: v.optional(v.string()),
    flagContentUri: v.optional(v.string()),
    reviewsUri: v.optional(v.string()),
})

export const atmosphereValidator = v.object({
    photos: v.array(placePhotoValidator),
    editorialSummary: v.optional(editorialSummaryValidator),
    reviewSummary: v.optional(reviewSummaryValidator),
    servesVegetarianFood: v.optional(v.boolean()),
    goodForGroups: v.optional(v.boolean()),
    reservable: v.optional(v.boolean()),
})

export const inviteTargetValidator = v.union(
    v.object({ kind: v.literal("friend") }),
    v.object({ kind: v.literal("group"), groupId: v.id("groups") }),
)

export const openingHoursValidator = v.object({
    openState: v.union(v.literal("open"), v.literal("closed"), v.literal("unknown")),
    periods: v.array(
        v.object({
            day: v.number(),
            openTime: v.string(),
            closeTime: v.string(),
        }),
    ),
    weekdayText: v.array(v.string()),
})
