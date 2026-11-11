import { defineTable } from "convex/server"
import { v } from "convex/values"

import { imageObjectValidator } from "../../validators"

export const identityTables = {
    profiles: defineTable({
        authUserId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.optional(imageObjectValidator),
    })
        .index("by_auth_user", ["authUserId"])
        .index("by_email", ["email"])
        .index("by_avatar_storage", ["avatar.storageId"]),
}
