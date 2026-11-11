import { defineTable } from "convex/server"
import { v } from "convex/values"

import { imageObjectValidator } from "../../validators"

export const identityTables = {
    profiles: defineTable({
        authUserId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.optional(imageObjectValidator),
        // Legacy: rows written before #201 carry createdAt (it copied _creationTime).
        // Relaxed per docs/migrations.md so the push accepts stored data; the
        // stripProfilesCreatedAt backfill removes the key, then this line goes.
        createdAt: v.optional(v.number()),
    })
        .index("by_auth_user", ["authUserId"])
        .index("by_email", ["email"])
        .index("by_avatar_storage", ["avatar.storageId"]),
}
