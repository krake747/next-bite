import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireMembership } from "./helpers"
import { getProfiles, nameOf, requireProfile, signedInProfile } from "./model/identity/profiles"

export const createGroup = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        const name = args.name.trim()
        if (name === "" || name.length > 80) {
            throw new Error("Group name must be 1-80 characters")
        }
        const groupId = await ctx.db.insert("groups", { ownerId: userId, name })
        await ctx.db.insert("groupMembers", { groupId, userId })
        return groupId
    },
})

export const leaveGroup = mutation({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
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
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        const userId = me._id
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
        const me = await signedInProfile(ctx)
        // See ADR-0004: null for missing or invisible.
        if (!me) {
            return null
        }
        const userId = me._id
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
        const names = await getProfiles(
            ctx.db,
            members.map((member) => member.userId),
        )
        return {
            group,
            isOwner: group.ownerId === userId,
            members: members.map((member) => ({
                userId: member.userId,
                name: nameOf(names, member.userId),
                isOwner: member.userId === group.ownerId,
            })),
        }
    },
})
