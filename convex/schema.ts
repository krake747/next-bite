import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { openingHoursValidator, restaurantImageValidator } from "./validators"

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
    // Better Auth tables will be added by the convex component
})
