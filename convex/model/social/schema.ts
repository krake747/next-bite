import { defineTable } from "convex/server"
import { v } from "convex/values"

export const friendshipStatusValidator = v.union(v.literal("pending"), v.literal("accepted"))

export const socialTables = {
    friendships: defineTable({
        userId: v.id("profiles"),
        friendId: v.id("profiles"),
        status: friendshipStatusValidator,
    })
        .index("by_pair", ["userId", "friendId"])
        .index("by_user_status", ["userId", "status"])
        .index("by_friend_status", ["friendId", "status"]),
}
