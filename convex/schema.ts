import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

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
        images: v.optional(v.array(v.object({ url: v.string(), storageId: v.string() }))),
        placeId: v.optional(v.string()),
        openingHours: v.optional(
            v.object({
                openNow: v.boolean(),
                periods: v.array(
                    v.object({
                        day: v.number(),
                        openTime: v.string(),
                        closeTime: v.string(),
                    }),
                ),
                weekdayText: v.array(v.string()),
            }),
        ),
    }),
    friends: defineTable({
        name: v.string(),
    }),
    // Better Auth tables will be added by the convex component
})
