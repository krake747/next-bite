import { v } from "convex/values"

import { internal } from "./_generated/api"
import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, type MutationCtx, query } from "./_generated/server"
import { FALLBACK_GROUP_NAME, requireMembership } from "./helpers"
import { getProfiles, nameOf, requireProfile } from "./model/identity/profiles"
import { inviteTargetValidator } from "./validators"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const createInvite = mutation({
    args: {
        target: inviteTargetValidator,
        invitedEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
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
        })
        return token
    },
})

export const getInvite = query({
    // See ADR-0005: bearer token, server-side accept.
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
        const inviter = await getProfiles(ctx.db, [invite.invitedBy])
        const groupName =
            invite.target.kind === "group"
                ? ((await ctx.db.get(invite.target.groupId))?.name ?? FALLBACK_GROUP_NAME)
                : undefined
        return {
            target: invite.target,
            invitedByName: nameOf(inviter, invite.invitedBy),
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
    userId: Id<"profiles">,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly groupId: Id<"groups"> }> {
    const group = await ctx.db.get(groupId)
    if (!group) {
        throw new Error("Group no longer exists")
    }
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
    await ctx.db.insert("groupMembers", { groupId, userId })
    return { result: "accepted", groupId }
}

async function acceptFriendInvite(
    ctx: MutationCtx,
    invite: Doc<"invitations">,
    userId: Id<"profiles">,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly friendId: Id<"profiles"> }> {
    if (invite.invitedBy === userId) {
        throw new Error("You cannot accept your own invitation")
    }
    const pair = await ctx.db
        .query("friendships")
        .withIndex("by_owner_friend", (q) => q.eq("ownerId", invite.invitedBy).eq("friendId", userId))
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
        const userId = (await requireProfile(ctx))._id
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
        const userId = (await requireProfile(ctx))._id
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
                if (invite.invitedBy !== userId && group.ownerId !== userId) {
                    throw new Error("Unauthorized: only the inviter or the group owner can revoke this link")
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
