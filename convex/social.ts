import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}

function cleanDisplayName(displayName: string): string {
    const trimmed = displayName.trim().slice(0, 60)
    if (trimmed === "") {
        throw new Error("Display name is required")
    }
    return trimmed
}

export const listInterests = query({
    args: {},
    handler: async (ctx) => ctx.db.query("interests").collect(),
})

export const listLikes = query({
    args: {},
    handler: async (ctx) => ctx.db.query("likes").collect(),
})

export const listComments = query({
    args: {},
    handler: async (ctx) => ctx.db.query("comments").collect(),
})

export const getForRestaurant = query({
    args: {
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const [interests, likes, comments] = await Promise.all([
            ctx.db
                .query("interests")
                .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
                .collect(),
            ctx.db
                .query("likes")
                .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
                .collect(),
            ctx.db
                .query("comments")
                .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
                .collect(),
        ])
        return { interests, likes, comments }
    },
})

export const getSummaries = query({
    args: {
        restaurantIds: v.array(v.id("restaurants")),
    },
    handler: async (ctx, args) => {
        if (args.restaurantIds.length > 100) {
            throw new Error("Too many restaurants requested")
        }
        const identity = await ctx.auth.getUserIdentity()
        const userId = identity?.subject ?? null
        return Promise.all(
            args.restaurantIds.map(async (restaurantId) => {
                const [interests, likes, comments] = await Promise.all([
                    ctx.db
                        .query("interests")
                        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
                        .collect(),
                    ctx.db
                        .query("likes")
                        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
                        .collect(),
                    ctx.db
                        .query("comments")
                        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
                        .collect(),
                ])
                const wants = interests.filter((interest) => interest.status === "want")
                const beens = interests.filter((interest) => interest.status === "been")
                return {
                    restaurantId,
                    wantCount: wants.length,
                    beenCount: beens.length,
                    likeCount: likes.length,
                    commentCount: comments.length,
                    wanted: userId === null ? false : wants.some((interest) => interest.userId === userId),
                    liked: userId === null ? false : likes.some((like) => like.userId === userId),
                    interestedNames: interests.slice(0, 5).map((interest) => interest.displayName),
                }
            }),
        )
    },
})

export const toggleInterest = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        status: v.union(v.literal("want"), v.literal("been")),
        displayName: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        const name = cleanDisplayName(args.displayName)
        const existing = await ctx.db
            .query("interests")
            .withIndex("by_user_restaurant", (q) => q.eq("userId", userId).eq("restaurantId", args.restaurantId))
            .unique()
        if (existing) {
            if (existing.status === args.status) {
                await ctx.db.delete(existing._id)
                return null
            }
            await ctx.db.patch(existing._id, { status: args.status, displayName: name, updatedAt: Date.now() })
            return existing._id
        }
        return ctx.db.insert("interests", {
            restaurantId: args.restaurantId,
            userId,
            displayName: name,
            status: args.status,
            updatedAt: Date.now(),
        })
    },
})

export const toggleLike = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        displayName: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        const name = cleanDisplayName(args.displayName)
        const existing = await ctx.db
            .query("likes")
            .withIndex("by_user_restaurant", (q) => q.eq("userId", userId).eq("restaurantId", args.restaurantId))
            .unique()
        if (existing) {
            await ctx.db.delete(existing._id)
            return null
        }
        return ctx.db.insert("likes", {
            restaurantId: args.restaurantId,
            userId,
            displayName: name,
            createdAt: Date.now(),
        })
    },
})

export const addComment = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        text: v.string(),
        displayName: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        const name = cleanDisplayName(args.displayName)
        const text = args.text.trim().slice(0, 500)
        if (text === "") {
            throw new Error("Comment text is required")
        }
        return ctx.db.insert("comments", {
            restaurantId: args.restaurantId,
            userId,
            displayName: name,
            text,
            createdAt: Date.now(),
        })
    },
})

export const deleteComment = mutation({
    args: { id: v.id("comments") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const comment = await ctx.db.get(args.id)
        if (!comment) {
            throw new Error("Comment not found")
        }
        if (comment.userId !== userId) {
            throw new Error("Unauthorized: only the author can delete this comment")
        }
        await ctx.db.delete(args.id)
    },
})
