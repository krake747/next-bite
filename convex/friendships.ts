import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel } from "./_generated/dataModel"
import { type Doc } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import { requireUserId } from "./helpers"

type FriendshipRow = Doc<"friendships">

async function findRow(
    db: GenericDatabaseReader<DataModel>,
    ownerId: string,
    friendAuthUserId: string,
): Promise<FriendshipRow | null> {
    return db
        .query("friendships")
        .withIndex("by_owner_friend", (q) => q.eq("ownerId", ownerId).eq("friendAuthUserId", friendAuthUserId))
        .unique()
}

async function acceptPair(db: GenericDatabaseWriter<DataModel>, a: string, b: string): Promise<void> {
    const forward = await findRow(db, a, b)
    if (forward) {
        await db.patch(forward._id, { status: "accepted" })
    } else {
        await db.insert("friendships", { ownerId: a, friendAuthUserId: b, status: "accepted", createdAt: Date.now() })
    }
    const mirror = await findRow(db, b, a)
    if (mirror) {
        await db.patch(mirror._id, { status: "accepted" })
    } else {
        await db.insert("friendships", { ownerId: b, friendAuthUserId: a, status: "accepted", createdAt: Date.now() })
    }
}

export const requestFriend = mutation({
    args: {
        friendAuthUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        if (args.friendAuthUserId === userId) {
            throw new Error("You cannot befriend yourself")
        }
        const existing = await findRow(ctx.db, userId, args.friendAuthUserId)
        if (existing) {
            return existing._id
        }
        return ctx.db.insert("friendships", {
            ownerId: userId,
            friendAuthUserId: args.friendAuthUserId,
            status: "pending",
            createdAt: Date.now(),
        })
    },
})

export const acceptFriend = mutation({
    args: {
        friendAuthUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const incoming = await findRow(ctx.db, args.friendAuthUserId, userId)
        if (!incoming) {
            throw new Error("No pending friend request")
        }
        await acceptPair(ctx.db, args.friendAuthUserId, userId)
        return incoming._id
    },
})

export const removeFriend = mutation({
    args: {
        friendAuthUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const forward = await findRow(ctx.db, userId, args.friendAuthUserId)
        if (forward) {
            await ctx.db.delete(forward._id)
        }
        const mirror = await findRow(ctx.db, args.friendAuthUserId, userId)
        if (mirror) {
            await ctx.db.delete(mirror._id)
        }
    },
})

export const listFriends = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        const rows = await ctx.db
            .query("friendships")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .collect()
        const accepted = rows.filter((row) => row.status === "accepted")
        return Promise.all(
            accepted.map(async (row) => {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("by_auth_user", (q) => q.eq("authUserId", row.friendAuthUserId))
                    .unique()
                return { authUserId: row.friendAuthUserId, name: profile?.name ?? "Someone" }
            }),
        )
    },
})

export const _ensurePair = internalMutation({
    args: {
        a: v.string(),
        b: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.a === args.b) {
            throw new Error("You cannot befriend yourself")
        }
        await acceptPair(ctx.db, args.a, args.b)
    },
})
