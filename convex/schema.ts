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
        rating: v.optional(v.number()),
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
    visitMemories: defineTable({
        restaurantId: v.id("restaurants"),
        userId: v.string(),
        displayName: v.string(),
        images: v.array(restaurantImageValidator),
        createdAt: v.number(),
    }).index("by_restaurant", ["restaurantId"]),
    interests: defineTable({
        ...socialFields,
        status: v.union(v.literal("want"), v.literal("been")),
        updatedAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_user", ["userId"])
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
    })
        .index("by_auth_user", ["authUserId"])
        .index("by_email", ["email"]),
    friendships: defineTable({
        ownerId: v.string(),
        friendAuthUserId: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted")),
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_friend", ["ownerId", "friendAuthUserId"])
        .index("by_friend", ["friendAuthUserId"]),
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
        targetGroupId: v.optional(v.id("groups")),
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_sharer", ["sharedBy"])
        .index("by_target_group", ["targetGroupId"]),
    invitations: defineTable({
        token: v.string(),
        target: inviteTargetValidator,
        invitedEmail: v.optional(v.string()),
        invitedBy: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
        expiresAt: v.number(),
        createdAt: v.number(),
    }).index("by_token", ["token"]),
    uploads: defineTable({
        storageId: v.id("_storage"),
        ownerId: v.string(),
        restaurantId: v.optional(v.id("restaurants")),
        mimeType: v.optional(v.string()),
        byteSize: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_storage", ["storageId"]),
    // Better Auth tables will be added by the convex component
})
