import { type GenericMutationCtx } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { FALLBACK_DISPLAY_NAME, formatDisplayName, requireUserId } from "./helpers"
import { isRestaurantVisibleTo } from "./shares"

async function serverDisplayName(ctx: Parameters<typeof authComponent.getAuthUser>[0]): Promise<string> {
    try {
        const user = await authComponent.getAuthUser(ctx)
        return formatDisplayName(user.name, user.email ?? undefined)
    } catch {
        return FALLBACK_DISPLAY_NAME
    }
}

async function requireRestaurant(
    ctx: {
        db: { get: (id: Id<"restaurants">) => Promise<Doc<"restaurants"> | null> }
    },
    restaurantId: Id<"restaurants">,
): Promise<Doc<"restaurants">> {
    const restaurant = await ctx.db.get(restaurantId)
    if (!restaurant) {
        throw new Error("Restaurant not found")
    }
    return restaurant
}

async function requireVisibleRestaurant(
    ctx: GenericMutationCtx<DataModel>,
    restaurantId: Id<"restaurants">,
): Promise<{ userId: string; name: string }> {
    const userId = await requireUserId(ctx)
    const restaurant = await requireRestaurant(ctx, restaurantId)
    const visible = await isRestaurantVisibleTo(ctx.db, userId, restaurant)
    if (!visible) {
        throw new Error("Unauthorized: restaurant is not shared with you")
    }
    const name = await serverDisplayName(ctx)
    return { userId, name }
}

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
    },
    handler: async (ctx, args) => {
        const { userId, name } = await requireVisibleRestaurant(ctx, args.restaurantId)
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
    },
    handler: async (ctx, args) => {
        const { userId, name } = await requireVisibleRestaurant(ctx, args.restaurantId)
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
    },
    handler: async (ctx, args) => {
        const { userId, name } = await requireVisibleRestaurant(ctx, args.restaurantId)
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
