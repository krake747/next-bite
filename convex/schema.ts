import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    restaurants: defineTable({
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.string(),
        rating: v.optional(v.number()),
        userId: v.optional(v.id("users")),
    }),
    friends: defineTable({
        name: v.string(),
    }),
    // Better Auth tables will be added by the convex component
})
