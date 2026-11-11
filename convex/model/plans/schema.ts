import { defineTable } from "convex/server"
import { v } from "convex/values"

export const plansTables = {
    plans: defineTable({
        groupId: v.optional(v.id("groups")),
        restaurantId: v.optional(v.id("restaurants")),
        createdBy: v.id("profiles"),
        title: v.string(),
        date: v.number(),
        status: v.union(v.literal("planned"), v.literal("done"), v.literal("cancelled")),
    })
        .index("by_group", ["groupId"])
        .index("by_restaurant", ["restaurantId"])
        .index("by_creator", ["createdBy"]),
    planParticipants: defineTable({
        planId: v.id("plans"),
        userId: v.id("profiles"),
    })
        .index("by_plan", ["planId"])
        .index("by_plan_user", ["planId", "userId"])
        .index("by_user", ["userId"]),
}
