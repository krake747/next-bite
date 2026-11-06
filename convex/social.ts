import { type GenericDatabaseReader, type GenericMutationCtx } from "convex/server"
import { v } from "convex/values"

import { countReactions } from "../src/core/social-counts"
import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { formatDisplayName, readAuthUser, requireUserId } from "./helpers"
import { isRestaurantVisibleTo } from "./visibility"

async function serverDisplayName(ctx: Parameters<typeof authComponent.getAuthUser>[0]): Promise<string> {
    const user = await readAuthUser(ctx)
    return formatDisplayName(user?.name, user?.email ?? undefined)
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

type SocialRows = {
    interests: Doc<"interests">[]
    likes: Doc<"likes">[]
    comments: Doc<"comments">[]
}

async function collectSocialFor(
    db: GenericDatabaseReader<DataModel>,
    restaurantId: Id<"restaurants">,
): Promise<SocialRows> {
    const [interests, likes, comments] = await Promise.all([
        db
            .query("interests")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .collect(),
        db
            .query("likes")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .collect(),
        db
            .query("comments")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .collect(),
    ])
    return { interests, likes, comments }
}

export const getForRestaurant = query({
    args: {
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        // Same anti-oracle rule as restaurants.getById: strangers learn nothing, not even
        // whether the id exists. Callers only query visible restaurants, so null is unreachable
        // in practice; it exists so enumeration proves nothing.
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            return null
        }
        const visible = await isRestaurantVisibleTo(ctx.db, identity.subject, restaurant)
        if (!visible) {
            return null
        }
        return collectSocialFor(ctx.db, args.restaurantId)
    },
})

export const listMyStatuses = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        const rows = await ctx.db
            .query("interests")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect()
        return rows.map((row) => ({ restaurantId: row.restaurantId, status: row.status }))
    },
})

export const getSummaries = query({
    // Signed-out callers get aggregate counts with no personal flags; identity only adds the
    // viewer's own wanted/liked state. Nothing per-user leaks to strangers.
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
                const { interests, likes, comments } = await collectSocialFor(ctx.db, restaurantId)
                const counts = countReactions(interests, likes, userId)
                return {
                    restaurantId,
                    wantCount: counts.wantCount,
                    beenCount: counts.beenCount,
                    likeCount: counts.likeCount,
                    commentCount: comments.length,
                    wanted: counts.wanted,
                    liked: counts.liked,
                    interestedNames: counts.interestedNames.slice(0, 5),
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
