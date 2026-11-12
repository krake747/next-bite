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
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
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
