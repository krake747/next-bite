import { defineTable } from "convex/server"
import { v } from "convex/values"

import { placeGoogleValidator } from "../../validators"

export const placesTables = {
    places: defineTable({
        ownerId: v.id("profiles"),
        name: v.string(),
        cuisine: v.optional(v.string()),
        address: v.object({
            label: v.string(),
            google: v.optional(placeGoogleValidator),
        }),
        note: v.optional(v.string()),
        link: v.optional(v.string()),
        clientMutationId: v.optional(v.string()),
    }).index("by_owner", ["ownerId"]),
    photos: defineTable({
        storageId: v.id("_storage"),
        placeId: v.id("places"),
        url: v.string(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        byteSize: v.optional(v.number()),
    })
        .index("by_storage", ["storageId"])
        .index("by_place", ["placeId"]),
    saves: defineTable({
        placeId: v.id("places"),
        userId: v.id("profiles"),
        status: v.union(v.literal("want"), v.literal("been")),
        updatedAt: v.number(),
    })
        .index("by_place", ["placeId"])
        .index("by_user_place", ["userId", "placeId"]),
    groupPlaces: defineTable({
        groupId: v.id("groups"),
        placeId: v.id("places"),
        addedBy: v.id("profiles"),
    })
        .index("by_place", ["placeId"])
        .index("by_group_place", ["groupId", "placeId"]),
    clientMutations: defineTable({
        key: v.string(),
        userId: v.id("profiles"),
        placeId: v.id("places"),
    }).index("by_user_key", ["userId", "key"]),
}
