import { v } from "convex/values"

export const restaurantImageValidator = v.object({ url: v.string(), storageId: v.string() })

export const imageObjectValidator = v.object({
    url: v.string(),
    storageId: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    byteSize: v.optional(v.number()),
})

export const coordsValidator = v.object({
    lat: v.number(),
    lng: v.number(),
})

export const shareTargetValidator = v.union(
    v.object({ kind: v.literal("user"), userId: v.string() }),
    v.object({ kind: v.literal("group"), groupId: v.id("groups") }),
)

export const inviteTargetValidator = v.union(
    v.object({ kind: v.literal("friend") }),
    v.object({ kind: v.literal("group"), groupId: v.id("groups") }),
)

export const collectionScopeValidator = v.object({
    kind: v.literal("group"),
    groupId: v.id("groups"),
})
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

export const enrichmentValidator = v.object({
    placeId: v.optional(v.string()),
    coords: v.optional(coordsValidator),
    openingHours: v.optional(openingHoursValidator),
})
