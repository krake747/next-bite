import { defineTable } from "convex/server"
import { v } from "convex/values"

import { imageObjectValidator } from "../../validators"

export const identityTables = {
    profiles: defineTable({
        authUserId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.optional(imageObjectValidator),
        createdAt: v.number(),
    })
        .index("by_auth_user", ["authUserId"])
        .index("by_email", ["email"]),
    uploads: defineTable({
        storageId: v.id("_storage"),
        ownerId: v.string(),
        restaurantId: v.optional(v.id("restaurants")),
        purpose: v.optional(v.union(v.literal("restaurant"), v.literal("avatar"), v.literal("transient"))),
        expiresAt: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        byteSize: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_storage", ["storageId"])
        .index("by_expires", ["expiresAt"]),
}
