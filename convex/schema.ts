import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    restaurants: defineTable({
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        notes: v.optional(v.string()),
        addedBy: v.string(),
        createdAt: v.number(),
    }),
    friends: defineTable({
        name: v.string(),
    }),
})
