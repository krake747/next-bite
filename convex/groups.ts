import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel } from "./_generated/dataModel"
import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireUserId } from "./helpers"
import { imageObjectValidator } from "./validators"

type Membership = Doc<"groupMembers">

export async function requireMembership(
    db: GenericDatabaseReader<DataModel>,
    groupId: Id<"groups">,
    userId: string,
): Promise<Membership> {
    const group = await db.get(groupId)
    if (!group) {
        throw new Error("Group not found")
    }
    const membership = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (!membership) {
        throw new Error("Unauthorized: group membership required")
    }
    return membership
}

export const createGroup = mutation({
    args: {
        name: v.string(),
        image: v.optional(imageObjectValidator),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const name = args.name.trim()
        if (name === "") {
            throw new Error("Group name is required")
        }
        const groupId = await ctx.db.insert("groups", {
            ownerId: userId,
            name,
            ...(args.image !== undefined ? { image: args.image } : {}),
            createdAt: Date.now(),
        })
        await ctx.db.insert("groupMembers", { groupId, userId, role: "admin", joinedAt: Date.now() })
        return groupId
    },
})

export const renameGroup = mutation({
    args: {
        groupId: v.id("groups"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const membership = await requireMembership(ctx.db, args.groupId, userId)
        if (membership.role !== "admin") {
            throw new Error("Unauthorized: only admins can rename the group")
        }
        const name = args.name.trim()
        if (name === "") {
            throw new Error("Group name is required")
        }
        await ctx.db.patch(args.groupId, { name })
        return args.groupId
    },
})

export const addMember = mutation({
    args: {
        groupId: v.id("groups"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const callerId = await requireUserId(ctx)
        const membership = await requireMembership(ctx.db, args.groupId, callerId)
        if (membership.role !== "admin") {
            throw new Error("Unauthorized: only admins can add members")
        }
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", args.userId))
            .unique()
        if (!profile) {
            throw new Error("User not found")
        }
        const existing = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId).eq("userId", args.userId))
            .unique()
        if (existing) {
            return existing._id
        }
        return ctx.db.insert("groupMembers", {
            groupId: args.groupId,
            userId: args.userId,
            role: "member",
            joinedAt: Date.now(),
        })
    },
})

export const removeMember = mutation({
    args: {
        groupId: v.id("groups"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const callerId = await requireUserId(ctx)
        const group = await ctx.db.get(args.groupId)
        if (!group) {
            throw new Error("Group not found")
        }
        if (args.userId === group.ownerId) {
            throw new Error("The group owner cannot be removed")
        }
        if (args.userId !== callerId) {
            const membership = await requireMembership(ctx.db, args.groupId, callerId)
            if (membership.role !== "admin") {
                throw new Error("Unauthorized: only admins can remove members")
            }
        } else {
            await requireMembership(ctx.db, args.groupId, callerId)
        }
        const row = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId).eq("userId", args.userId))
            .unique()
        if (!row) {
            throw new Error("Membership not found")
        }
        await ctx.db.delete(row._id)
        return row._id
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
        return memberships.flatMap((membership, index) => {
            const group = groups[index]
            return group ? [{ group, role: membership.role }] : []
        })
    },
})
