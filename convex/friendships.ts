import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel } from "./_generated/dataModel"
import { type Doc } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import { FALLBACK_DISPLAY_NAME, requireUserId } from "./helpers"
import { isRestaurantVisibleTo } from "./visibility"

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
        // Befriending resolves against a real profile, like group adds do. Unknown ids fail
        // here instead of leaving phantom pending rows nothing can ever accept.
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", args.friendAuthUserId))
            .unique()
        if (!profile) {
            throw new Error("User not found")
        }
        // Mutual interest completes the friendship instead of leaving crossed pendings.
        const incoming = await findRow(ctx.db, args.friendAuthUserId, userId)
        if (incoming && incoming.status === "pending") {
            await acceptPair(ctx.db, args.friendAuthUserId, userId)
            return incoming._id
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

export const requestFriendByEmail = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const address = args.email.trim()
        if (address === "") {
            throw new Error("Email is required")
        }
        // Profiles store the email as registered; try the exact address before the lowercase
        // form so mixed-case registrations still resolve.
        const exact = await ctx.db
            .query("profiles")
            .withIndex("by_email", (q) => q.eq("email", address))
            .unique()
        const lowered =
            exact === null
                ? await ctx.db
                      .query("profiles")
                      .withIndex("by_email", (q) => q.eq("email", address.toLowerCase()))
                      .unique()
                : null
        const profile = exact ?? lowered
        if (!profile) {
            throw new Error("Nobody joined with that email yet")
        }
        if (profile.authUserId === userId) {
            throw new Error("You cannot befriend yourself")
        }
        // Mutual interest completes the friendship instead of leaving crossed pendings.
        const incoming = await findRow(ctx.db, profile.authUserId, userId)
        if (incoming && incoming.status === "pending") {
            await acceptPair(ctx.db, profile.authUserId, userId)
            return incoming._id
        }
        const existing = await findRow(ctx.db, userId, profile.authUserId)
        if (existing) {
            return existing._id
        }
        return ctx.db.insert("friendships", {
            ownerId: userId,
            friendAuthUserId: profile.authUserId,
            status: "pending",
            createdAt: Date.now(),
        })
    },
})

export const listDiscoveries = query({
    args: {
        friendAuthUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const row = await findRow(ctx.db, userId, args.friendAuthUserId)
        if (!row || row.status !== "accepted") {
            throw new Error("Unauthorized: friends only")
        }
        const owned = await ctx.db
            .query("restaurants")
            .withIndex("by_owner", (q) => q.eq("ownerId", args.friendAuthUserId))
            .collect()
        const visible: Doc<"restaurants">[] = []
        for (const restaurant of owned) {
            if (await isRestaurantVisibleTo(ctx.db, userId, restaurant)) {
                visible.push(restaurant)
            }
        }
        return visible.toSorted((a, b) => b._creationTime - a._creationTime).slice(0, 5)
    },
})
export const listFriendRequests = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        const [outgoingRows, incomingRows] = await Promise.all([
            ctx.db
                .query("friendships")
                .withIndex("by_owner", (q) => q.eq("ownerId", userId))
                .collect(),
            ctx.db
                .query("friendships")
                .withIndex("by_friend", (q) => q.eq("friendAuthUserId", userId))
                .collect(),
        ])
        const outgoing = outgoingRows.filter((row) => row.status === "pending")
        const incoming = incomingRows.filter((row) => row.status === "pending" && row.ownerId !== userId)
        const nameOf = async (authUserId: string): Promise<string> => {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
                .unique()
            return profile?.name ?? FALLBACK_DISPLAY_NAME
        }
        return {
            incoming: await Promise.all(
                incoming.map(async (row) => ({ authUserId: row.ownerId, name: await nameOf(row.ownerId) })),
            ),
            outgoing: await Promise.all(
                outgoing.map(async (row) => ({
                    authUserId: row.friendAuthUserId,
                    name: await nameOf(row.friendAuthUserId),
                })),
            ),
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
                return { authUserId: row.friendAuthUserId, name: profile?.name ?? FALLBACK_DISPLAY_NAME }
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
