import { defineTable } from "convex/server"
import { v } from "convex/values"

import { inviteTargetValidator } from "../../validators"

export const groupsTables = {
    groups: defineTable({
        ownerId: v.string(),
        name: v.string(),
        createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),
    groupMembers: defineTable({
        groupId: v.id("groups"),
        userId: v.string(),
        joinedAt: v.number(),
    })
        .index("by_group", ["groupId"])
        .index("by_user", ["userId"])
        .index("by_group_user", ["groupId", "userId"]),
    invitations: defineTable({
        token: v.string(),
        target: inviteTargetValidator,
        invitedEmail: v.optional(v.string()),
        invitedBy: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("revoked")),
        expiresAt: v.number(),
        createdAt: v.number(),
    }).index("by_token", ["token"]),
}
