import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
    enrichmentValidator,
    imageObjectValidator,
    inviteTargetValidator,
    restaurantImageValidator,
    shareTargetValidator,
} from "./validators"

const socialFields = {
    restaurantId: v.id("restaurants"),
    userId: v.string(),
    displayName: v.string(),
}

export default defineSchema({
    // TEMPORARY BACKFILL STEP 1: legacy fields are tolerated only until
    // migrate:backfillLegacyRestaurants has run. Re-tighten right after:
    // drop the legacy block below and restore required fields.
    restaurants: defineTable({
        ownerId: v.optional(v.string()),
        ownerName: v.optional(v.string()),
        name: v.string(),
        cuisine: v.string(),
        address: v.optional(
            v.object({
                label: v.string(),
                enrichment: v.optional(enrichmentValidator),
            }),
        ),
        details: v.optional(
            v.object({
                notes: v.optional(v.string()),
                link: v.optional(v.string()),
            }),
        ),
        rating: v.optional(v.number()),
        images: v.optional(v.array(v.union(v.string(), restaurantImageValidator))),
        visibility: v.optional(v.union(v.literal("private"), v.literal("shared"))),
        createdAt: v.optional(v.number()),
        // Legacy flat shape (pre-address/owner schema). Remove on re-tighten.
        addedBy: v.optional(v.string()),
        location: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        placeId: v.optional(v.string()),
        link: v.optional(v.string()),
        notes: v.optional(v.string()),
        openingHours: v.optional(
            v.object({
                openNow: v.optional(v.boolean()),
                periods: v.optional(
                    v.array(v.object({ day: v.number(), openTime: v.string(), closeTime: v.string() })),
                ),
                weekdayText: v.optional(v.array(v.string())),
            }),
        ),
    }).index("by_owner", ["ownerId"]),
    interests: defineTable({
        ...socialFields,
        status: v.union(v.literal("want"), v.literal("been")),
        updatedAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_user_restaurant", ["userId", "restaurantId"]),
    likes: defineTable({
        ...socialFields,
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_user_restaurant", ["userId", "restaurantId"]),
    comments: defineTable({
        ...socialFields,
        text: v.string(),
        createdAt: v.number(),
    }).index("by_restaurant", ["restaurantId"]),
    profiles: defineTable({
        authUserId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.optional(imageObjectValidator),
        createdAt: v.number(),
    }).index("by_auth_user", ["authUserId"]),
    friendships: defineTable({
        ownerId: v.string(),
        friendAuthUserId: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted")),
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_friend", ["ownerId", "friendAuthUserId"]),
    groups: defineTable({
        ownerId: v.string(),
        name: v.string(),
        image: v.optional(imageObjectValidator),
        createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),
    groupMembers: defineTable({
        groupId: v.id("groups"),
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
        joinedAt: v.number(),
    })
        .index("by_group", ["groupId"])
        .index("by_user", ["userId"])
        .index("by_group_user", ["groupId", "userId"]),
    restaurantShares: defineTable({
        restaurantId: v.id("restaurants"),
        sharedBy: v.string(),
        target: shareTargetValidator,
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_sharer", ["sharedBy"]),
    collections: defineTable({
        ownerId: v.string(),
        name: v.string(),
        description: v.string(),
        groupId: v.optional(v.id("groups")),
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_group", ["groupId"]),
    collectionItems: defineTable({
        collectionId: v.id("collections"),
        restaurantId: v.id("restaurants"),
        addedBy: v.string(),
        addedAt: v.number(),
    })
        .index("by_collection", ["collectionId"])
        .index("by_restaurant", ["restaurantId"]),
    invitations: defineTable({
        token: v.string(),
        target: inviteTargetValidator,
        invitedEmail: v.optional(v.string()),
        invitedBy: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
        expiresAt: v.number(),
        createdAt: v.number(),
    }).index("by_token", ["token"]),
    // Better Auth tables will be added by the convex component
})
