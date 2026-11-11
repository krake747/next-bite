import { defineTable } from "convex/server"
import { v } from "convex/values"

import { enrichmentValidator, restaurantImageValidator, shareTargetValidator } from "../../validators"

export const placesTables = {
    restaurants: defineTable({
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
        visibility: v.union(v.literal("private"), v.literal("shared")),
        clientMutationId: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),
    clientMutations: defineTable({
        key: v.string(),
        userId: v.string(),
        restaurantId: v.id("restaurants"),
        createdAt: v.number(),
    }).index("by_user_key", ["userId", "key"]),
    restaurantShares: defineTable({
        restaurantId: v.id("restaurants"),
        sharedBy: v.string(),
        target: shareTargetValidator,
        targetGroupId: v.optional(v.id("groups")),
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_sharer", ["sharedBy"])
        .index("by_target_group", ["targetGroupId"]),
}
