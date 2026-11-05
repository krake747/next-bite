import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
    collectionScopeValidator,
    imageObjectValidator,
    inviteTargetValidator,
    openingHoursValidator,
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
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.string(),
        rating: v.optional(v.number()),
        userId: v.optional(v.id("users")),
        images: v.optional(v.array(restaurantImageValidator)),
        placeId: v.optional(v.string()),
        openingHours: v.optional(openingHoursValidator),
    }),
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
    friends: defineTable({
        name: v.string(),
    }),
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
        scope: v.optional(collectionScopeValidator),
        createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),
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
