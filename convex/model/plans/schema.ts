import { defineTable } from "convex/server"
import { v } from "convex/values"

export const plansTables = {
    plans: defineTable({
        groupId: v.id("groups"),
        placeId: v.id("places"),
        createdBy: v.id("profiles"),
        startsAt: v.number(),
        status: v.union(v.literal("planned"), v.literal("cancelled")),
    }).index("by_group_starts", ["groupId", "startsAt"]),
}
