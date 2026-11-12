import { defineTable } from "convex/server"
import { v } from "convex/values"

import { inviteTargetValidator } from "../../validators"

export const groupsTables = {
    groups: defineTable({
        ownerId: v.id("profiles"),
        name: v.string(),
    }).index("by_owner", ["ownerId"]),
    groupMembers: defineTable({
        groupId: v.id("groups"),
        userId: v.id("profiles"),
    })
        .index("by_user", ["userId"])
        .index("by_group_user", ["groupId", "userId"]),
    invites: defineTable({
        token: v.string(),
        target: inviteTargetValidator,
        createdBy: v.id("profiles"),
        expiresAt: v.number(),
    }).index("by_token", ["token"]),
}
