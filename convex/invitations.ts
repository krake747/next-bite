import { v } from "convex/values"

import { internal } from "./_generated/api"
import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, type MutationCtx, query } from "./_generated/server"
import { FALLBACK_GROUP_NAME, formatDisplayName, requireMembership, requireUserId } from "./helpers"
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
        const normalizedEmail =
            args.invitedEmail !== undefined ? args.invitedEmail.trim().toLowerCase().slice(0, 254) : undefined
        if (args.invitedEmail !== undefined && (normalizedEmail === undefined || normalizedEmail === "")) {
            throw new Error("Email is required")
        }
        const token = crypto.randomUUID()
        await ctx.db.insert("invitations", {
            token,
            target: args.target,
            ...(normalizedEmail !== undefined ? { invitedEmail: normalizedEmail } : {}),
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
    // what the token holder already has; acceptance validates server side per ADR-0015.
    // Reusable group links stay usable until expiry or revocation: the effective
    // status is computed here so previews stay honest without a write.
    args: {
        token: v.string(),
        now: v.number(),
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique()
        if (!invite) {
            throw new Error("Invitation not found")
        }
        if (invite.status === "revoked") {
            throw new Error("Invitation revoked")
        }
        if (invite.status === "expired" || args.now > invite.expiresAt) {
            throw new Error("Invitation expired")
        }
        if (invite.target.kind === "group") {
            const group = await ctx.db.get(invite.target.groupId)
            if (!group) {
                throw new Error("Group no longer exists")
            }
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
            invitedByName: formatDisplayName(inviter?.name),
            ...(groupName !== undefined ? { groupName } : {}),
            status: invite.status,
            expiresAt: invite.expiresAt,
        }
    },
})

async function loadUsableInviteForAccept(ctx: MutationCtx, token: string): Promise<Doc<"invitations">> {
    const invite = await ctx.db
        .query("invitations")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    if (!invite) {
        throw new Error("Invitation not found")
    }
    if (invite.status === "revoked") {
        throw new Error("Invitation revoked")
    }
    if (invite.status === "expired" || Date.now() > invite.expiresAt) {
        if (invite.status !== "expired") {
            await ctx.db.patch(invite._id, { status: "expired" })
        }
        throw new Error("Invitation expired")
    }
    return invite
}

async function acceptGroupInvite(
    ctx: MutationCtx,
    invite: Doc<"invitations">,
    groupId: Id<"groups">,
    userId: string,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly groupId: Id<"groups"> }> {
    const group = await ctx.db.get(groupId)
    if (!group) {
        throw new Error("Group no longer exists")
    }
    // Reusable group links: the inviter's current authority matters.
    // If the inviter left or was removed, the link stops working.
    const inviterMembership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", invite.invitedBy))
        .unique()
    if (!inviterMembership) {
        throw new Error("Invitation is no longer valid")
    }
    const existing = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (existing) {
        return { result: "alreadyMember", groupId }
    }
    await ctx.db.insert("groupMembers", { groupId, userId, role: "member", joinedAt: Date.now() })
    // Intentionally leave reusable group invites pending so the same
    // link admits every holder until expiry or revocation.
    return { result: "accepted", groupId }
}

async function acceptFriendInvite(
    ctx: MutationCtx,
    invite: Doc<"invitations">,
    userId: string,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly friendId: string }> {
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
        return { result: "alreadyMember", friendId: invite.invitedBy }
    }
    await ctx.runMutation(internal.friendships._ensurePair, { a: invite.invitedBy, b: userId })
    await ctx.db.patch(invite._id, { status: "accepted" })
    return { result: "accepted", friendId: invite.invitedBy }
}

export const acceptInvite = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const invite = await loadUsableInviteForAccept(ctx, args.token)
        if (invite.target.kind === "group") {
            return acceptGroupInvite(ctx, invite, invite.target.groupId, userId)
        }
        return acceptFriendInvite(ctx, invite, userId)
    },
})

export const revokeInvite = mutation({
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
        if (invite.status === "revoked") {
            return { result: "alreadyRevoked" as const }
        }
        const inviteTarget = invite.target
        if (inviteTarget.kind === "group") {
            const groupId = inviteTarget.groupId
            const group = await ctx.db.get(groupId)
            if (group) {
                const callerMembership = await ctx.db
                    .query("groupMembers")
                    .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
                    .unique()
                const isInviter = invite.invitedBy === userId
                const isAdmin = callerMembership?.role === "admin"
                if (!isInviter && !isAdmin) {
                    throw new Error("Unauthorized: only the inviter or a group admin can revoke this link")
                }
            } else if (invite.invitedBy !== userId) {
                throw new Error("Unauthorized: only the inviter can revoke this link")
            }
        } else if (invite.invitedBy !== userId) {
            throw new Error("Unauthorized: only the inviter can revoke this invitation")
        }
        await ctx.db.patch(invite._id, { status: "revoked" })
        return { result: "revoked" as const }
    },
})
