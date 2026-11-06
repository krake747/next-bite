import { v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { FALLBACK_DISPLAY_NAME, FALLBACK_GROUP_NAME, requireMembership, requireUserId } from "./helpers"
import { inviteTargetValidator } from "./validators"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const createInvite = mutation({
    args: {
        target: inviteTargetValidator,
        invitedEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        if (args.target.kind === "group") {
            await requireMembership(ctx.db, args.target.groupId, userId)
        }
        const token = crypto.randomUUID()
        await ctx.db.insert("invitations", {
            token,
            target: args.target,
            ...(args.invitedEmail !== undefined ? { invitedEmail: args.invitedEmail } : {}),
            invitedBy: userId,
            status: "pending",
            expiresAt: Date.now() + INVITE_TTL_MS,
            createdAt: Date.now(),
        })
        return token
    },
})

export const getInvite = query({
    // Public on purpose: the token is the bearer credential. Reading reveals nothing beyond
    // what the token holder already has; acceptance validates server side per ADR-0018.
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique()
        if (!invite) {
            throw new Error("Invitation not found")
        }
        const inviter = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", invite.invitedBy))
            .unique()
        const groupName =
            invite.target.kind === "group"
                ? ((await ctx.db.get(invite.target.groupId))?.name ?? FALLBACK_GROUP_NAME)
                : undefined
        return {
            target: invite.target,
            invitedByName: inviter?.name ?? FALLBACK_DISPLAY_NAME,
            ...(groupName !== undefined ? { groupName } : {}),
            status: invite.status,
            expiresAt: invite.expiresAt,
        }
    },
})

export const acceptInvite = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique()
        if (!invite) {
            throw new Error("Invitation not found")
        }
        if (invite.status === "expired" || Date.now() > invite.expiresAt) {
            if (invite.status !== "expired") {
                await ctx.db.patch(invite._id, { status: "expired" })
            }
            throw new Error("Invitation expired")
        }

        const target = invite.target
        if (target.kind === "group") {
            const existing = await ctx.db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", target.groupId).eq("userId", userId))
                .unique()
            if (existing) {
                if (invite.status !== "accepted") {
                    await ctx.db.patch(invite._id, { status: "accepted" })
                }
                return { result: "alreadyMember" as const, groupId: target.groupId }
            }
            await ctx.db.insert("groupMembers", {
                groupId: target.groupId,
                userId,
                role: "member",
                joinedAt: Date.now(),
            })
            await ctx.db.patch(invite._id, { status: "accepted" })
            return { result: "accepted" as const, groupId: target.groupId }
        }

        if (invite.invitedBy === userId) {
            throw new Error("You cannot accept your own invitation")
        }
        const pair = await ctx.db
            .query("friendships")
            .withIndex("by_owner_friend", (q) => q.eq("ownerId", invite.invitedBy).eq("friendAuthUserId", userId))
            .unique()
        if (pair?.status === "accepted") {
            if (invite.status !== "accepted") {
                await ctx.db.patch(invite._id, { status: "accepted" })
            }
            return { result: "alreadyMember" as const, friendId: invite.invitedBy }
        }
        await ctx.runMutation(internal.friendships._ensurePair, { a: invite.invitedBy, b: userId })
        await ctx.db.patch(invite._id, { status: "accepted" })
        return { result: "accepted" as const, friendId: invite.invitedBy }
    },
})
