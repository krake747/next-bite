import { defineTable } from "convex/server"
import { v } from "convex/values"

export const socialTables = {
    friendships: defineTable({
        ownerId: v.id("profiles"),
        friendId: v.id("profiles"),
        status: v.union(v.literal("pending"), v.literal("accepted")),
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_friend", ["ownerId", "friendId"])
        .index("by_friend", ["friendId"]),
    interests: defineTable({
        restaurantId: v.id("restaurants"),
        userId: v.id("profiles"),
        status: v.union(v.literal("want"), v.literal("been")),
        updatedAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_user", ["userId"])
        .index("by_user_restaurant", ["userId", "restaurantId"]),
}
