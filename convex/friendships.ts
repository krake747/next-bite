import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import { getProfiles, nameOf, profileByEmail, requireProfile, signedInProfile } from "./model/identity/profiles"

type FriendshipRow = Doc<"friendships">
type ProfileId = Id<"profiles">

async function findRow(
    db: GenericDatabaseReader<DataModel>,
    ownerId: ProfileId,
    friendId: ProfileId,
): Promise<FriendshipRow | null> {
    return db
        .query("friendships")
        .withIndex("by_owner_friend", (q) => q.eq("ownerId", ownerId).eq("friendId", friendId))
        .unique()
}

async function acceptPair(db: GenericDatabaseWriter<DataModel>, a: ProfileId, b: ProfileId): Promise<void> {
    const existing = await findRow(db, a, b)
    if (existing) {
        await db.patch("friendships", existing._id, { status: "accepted" })
    } else {
        await db.insert("friendships", { ownerId: a, friendId: b, status: "accepted" })
    }
    const mirror = await findRow(db, b, a)
    if (mirror) {
        await db.patch("friendships", mirror._id, { status: "accepted" })
    } else {
        await db.insert("friendships", { ownerId: b, friendId: a, status: "accepted" })
    }
}

async function requestOrAccept(
    db: GenericDatabaseWriter<DataModel>,
    me: ProfileId,
    friendId: ProfileId,
): Promise<Id<"friendships">> {
    if (friendId === me) {
        throw new Error("You cannot befriend yourself")
    }
    const incoming = await findRow(db, friendId, me)
    if (incoming && incoming.status === "pending") {
        await acceptPair(db, friendId, me)
        return incoming._id
    }
    const existing = await findRow(db, me, friendId)
    if (existing) {
        return existing._id
    }
    return db.insert("friendships", { ownerId: me, friendId, status: "pending" })
}

export const requestFriend = mutation({
    args: {
        friendId: v.id("profiles"),
    },
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        const friend = await ctx.db.get("profiles", args.friendId)
        if (!friend) {
            throw new Error("User not found")
        }
        return requestOrAccept(ctx.db, me._id, friend._id)
    },
})

export const acceptFriend = mutation({
    args: {
        friendId: v.id("profiles"),
    },
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        const incoming = await findRow(ctx.db, args.friendId, me._id)
        if (!incoming) {
            throw new Error("No pending friend request")
        }
        await acceptPair(ctx.db, args.friendId, me._id)
        return incoming._id
    },
})

export const removeFriend = mutation({
    args: {
        friendId: v.id("profiles"),
    },
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        const existing = await findRow(ctx.db, me._id, args.friendId)
        if (existing) {
            await ctx.db.delete("friendships", existing._id)
        }
        const mirror = await findRow(ctx.db, args.friendId, me._id)
        if (mirror) {
            await ctx.db.delete("friendships", mirror._id)
        }
    },
})

export const requestFriendByEmail = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        if (args.email.trim() === "") {
            throw new Error("Email is required")
        }
        const friend = await profileByEmail(ctx.db, args.email)
        if (!friend) {
            throw new Error("Nobody joined with that email yet")
        }
        return requestOrAccept(ctx.db, me._id, friend._id)
    },
})

export const listFriendRequests = query({
    args: {},
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return { incoming: [], outgoing: [] }
        }
        const [outgoingRows, incomingRows] = await Promise.all([
            ctx.db
                .query("friendships")
                .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
                .collect(),
            ctx.db
                .query("friendships")
                .withIndex("by_friend", (q) => q.eq("friendId", me._id))
                .collect(),
        ])
        const outgoing = outgoingRows.filter((row) => row.status === "pending")
        const incoming = incomingRows.filter((row) => row.status === "pending" && row.ownerId !== me._id)
        const names = await getProfiles(ctx.db, [
            ...incoming.map((row) => row.ownerId),
            ...outgoing.map((row) => row.friendId),
        ])
        return {
            incoming: incoming.map((row) => ({ profileId: row.ownerId, name: nameOf(names, row.ownerId) })),
            outgoing: outgoing.map((row) => ({ profileId: row.friendId, name: nameOf(names, row.friendId) })),
        }
    },
})

export const listFriends = query({
    args: {},
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        const rows = await ctx.db
            .query("friendships")
            .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
            .collect()
        const accepted = rows.filter((row) => row.status === "accepted")
        const names = await getProfiles(
            ctx.db,
            accepted.map((row) => row.friendId),
        )
        return accepted.map((row) => ({ profileId: row.friendId, name: nameOf(names, row.friendId) }))
    },
})

export const _ensurePair = internalMutation({
    args: {
        a: v.id("profiles"),
        b: v.id("profiles"),
    },
    handler: async (ctx, args) => {
        if (args.a === args.b) {
            throw new Error("You cannot befriend yourself")
        }
        await acceptPair(ctx.db, args.a, args.b)
    },
})
