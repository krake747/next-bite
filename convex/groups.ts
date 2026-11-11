import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { formatDisplayName, requireMembership, requireUserId } from "./helpers"

export const createGroup = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const name = args.name.trim()
        if (name === "" || name.length > 80) {
            throw new Error("Group name must be 1-80 characters")
        }
        const groupId = await ctx.db.insert("groups", {
            ownerId: userId,
            name,
            createdAt: Date.now(),
        })
        await ctx.db.insert("groupMembers", { groupId, userId, joinedAt: Date.now() })
        return groupId
    },
})

export const leaveGroup = mutation({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const group = await ctx.db.get(args.groupId)
        if (!group) {
            throw new Error("Group not found")
        }
        if (userId === group.ownerId) {
            throw new Error("The group owner cannot leave")
        }
        const membership = await requireMembership(ctx.db, args.groupId, userId)
        await ctx.db.delete(membership._id)
        return membership._id
    },
})

export const listMyGroups = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        const memberships = await ctx.db
            .query("groupMembers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect()
        const groups = await Promise.all(memberships.map(async (membership) => ctx.db.get(membership.groupId)))
        return groups.flatMap((group) => (group ? [{ group, isOwner: group.ownerId === userId }] : []))
    },
})

export const getGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        // See ADR-0004: null for missing or invisible.
        const group = await ctx.db.get(args.groupId)
        if (!group) {
            return null
        }
        const membership = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
            .unique()
        if (!membership) {
            return null
        }
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect()
        const profiles = await Promise.all(
            members.map(async (member) =>
                ctx.db
                    .query("profiles")
                    .withIndex("by_auth_user", (q) => q.eq("authUserId", member.userId))
                    .unique(),
            ),
        )
        return {
            group,
            isOwner: group.ownerId === userId,
            members: members.map((member, index) => ({
                userId: member.userId,
                name: formatDisplayName(profiles[index]?.name),
                isOwner: member.userId === group.ownerId,
            })),
        }
    },
})
