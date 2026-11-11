import { defineTable } from "convex/server"
import { v } from "convex/values"

export const socialTables = {
    friendships: defineTable({
        ownerId: v.string(),
        friendAuthUserId: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted")),
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_friend", ["ownerId", "friendAuthUserId"])
        .index("by_friend", ["friendAuthUserId"]),
    interests: defineTable({
        restaurantId: v.id("restaurants"),
        userId: v.string(),
        displayName: v.string(),
        status: v.union(v.literal("want"), v.literal("been")),
        updatedAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_user", ["userId"])
        .index("by_user_restaurant", ["userId", "restaurantId"]),
}
