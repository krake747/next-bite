import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { inviteTargetValidator } from "../../validators"
import { getProfiles, nameOf } from "../identity/profiles"
import { areFriends, befriend } from "../social/friendships"
import { requireMember } from "./memberships"

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const inviteViewValidator = v.object({
    target: inviteTargetValidator,
    createdByName: v.string(),
    groupName: v.optional(v.string()),
    expiresAt: v.number(),
})

export const acceptResultValidator = v.union(
    v.object({
        result: v.union(v.literal("accepted"), v.literal("alreadyMember")),
        groupId: v.id("groups"),
    }),
    v.object({
        result: v.union(v.literal("accepted"), v.literal("alreadyMember")),
        friendId: v.id("profiles"),
    }),
)

export async function createInviteRecord(
    db: GenericDatabaseWriter<DataModel>,
    createdBy: Id<"profiles">,
    target: Doc<"invites">["target"],
): Promise<string> {
    if (target.kind === "group") {
        await requireMember(db, target.groupId, createdBy)
    }
    const token = crypto.randomUUID()
    await db.insert("invites", { token, target, createdBy, expiresAt: Date.now() + INVITE_TTL_MS })
    return token
}

async function loadUsableInvite(
    db: GenericDatabaseReader<DataModel>,
    token: string,
    now: number,
): Promise<Doc<"invites">> {
    const invite = await db
        .query("invites")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    if (invite === null) {
        throw new Error("Invitation not found")
    }
    if (now > invite.expiresAt) {
        throw new Error("Invitation expired")
    }
    return invite
}

export async function getInviteView(db: GenericDatabaseReader<DataModel>, token: string, now: number) {
    const invite = await loadUsableInvite(db, token, now)
    const names = await getProfiles(db, [invite.createdBy])
    const createdByName = nameOf(names, invite.createdBy)
    if (invite.target.kind === "group") {
        const group = await db.get("groups", invite.target.groupId)
        if (group === null) {
            throw new Error("Group no longer exists")
        }
        return { target: invite.target, createdByName, groupName: group.name, expiresAt: invite.expiresAt }
    }
    return { target: invite.target, createdByName, expiresAt: invite.expiresAt }
}

async function acceptGroupInvite(
    db: GenericDatabaseWriter<DataModel>,
    invite: Doc<"invites">,
    groupId: Id<"groups">,
    userId: Id<"profiles">,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly groupId: Id<"groups"> }> {
    const group = await db.get("groups", groupId)
    if (group === null) {
        throw new Error("Group no longer exists")
    }
    const inviterMembership = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", invite.createdBy))
        .unique()
    if (inviterMembership === null) {
        throw new Error("Invitation is no longer valid")
    }
    const existing = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (existing !== null) {
        return { result: "alreadyMember", groupId }
    }
    await db.insert("groupMembers", { groupId, userId })
    return { result: "accepted", groupId }
}

async function acceptFriendInvite(
    db: GenericDatabaseWriter<DataModel>,
    invite: Doc<"invites">,
    userId: Id<"profiles">,
): Promise<{ readonly result: "alreadyMember" | "accepted"; readonly friendId: Id<"profiles"> }> {
    if (invite.createdBy === userId) {
        throw new Error("You cannot accept your own invitation")
    }
    if (await areFriends(db, invite.createdBy, userId)) {
        return { result: "alreadyMember", friendId: invite.createdBy }
    }
    await befriend(db, invite.createdBy, userId)
    return { result: "accepted", friendId: invite.createdBy }
}

export async function acceptInviteRecord(db: GenericDatabaseWriter<DataModel>, userId: Id<"profiles">, token: string) {
    const invite = await loadUsableInvite(db, token, Date.now())
    if (invite.target.kind === "group") {
        return acceptGroupInvite(db, invite, invite.target.groupId, userId)
    }
    return acceptFriendInvite(db, invite, userId)
}

export async function revokeInviteRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: Id<"profiles">,
    token: string,
): Promise<{ readonly result: "revoked" }> {
    const invite = await db
        .query("invites")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    if (invite === null) {
        throw new Error("Invitation not found")
    }
    if (invite.target.kind === "group") {
        const group = await db.get("groups", invite.target.groupId)
        if (group !== null) {
            if (invite.createdBy !== userId && group.ownerId !== userId) {
                throw new Error("Unauthorized: only the inviter or the group owner can revoke this link")
            }
        } else if (invite.createdBy !== userId) {
            throw new Error("Unauthorized: only the inviter can revoke this link")
        }
    } else if (invite.createdBy !== userId) {
        throw new Error("Unauthorized: only the inviter can revoke this invitation")
    }
    await db.delete("invites", invite._id)
    return { result: "revoked" as const }
}
