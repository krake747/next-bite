import { type GenericDatabaseReader, type GenericMutationCtx } from "convex/server"
import { v } from "convex/values"

import { countReactions } from "../src/core/interests.counts"
import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { getProfiles, nameOf, requireProfile, signedInProfile, viewerProfile } from "./model/identity/profiles"
import { isRestaurantVisibleTo } from "./visibility"

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
): Promise<Id<"profiles">> {
    const me = await requireProfile(ctx)
    const restaurant = await requireRestaurant(ctx, restaurantId)
    const visible = await isRestaurantVisibleTo(ctx.db, me._id, restaurant)
    if (!visible) {
        throw new Error("Unauthorized: restaurant is not shared with you")
    }
    return me._id
}

type NamedInterest = Pick<Doc<"interests">, "restaurantId" | "userId" | "status"> & { displayName: string }

type SocialRows = {
    interests: NamedInterest[]
}

async function collectSocialFor(
    db: GenericDatabaseReader<DataModel>,
    restaurantId: Id<"restaurants">,
): Promise<SocialRows> {
    const rows = await db
        .query("interests")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
        .collect()
    const names = await getProfiles(
        db,
        rows.map((row) => row.userId),
    )
    return {
        interests: rows.map((row) => ({
            restaurantId: row.restaurantId,
            userId: row.userId,
            status: row.status,
            displayName: nameOf(names, row.userId),
        })),
    }
}

export const getForRestaurant = query({
    args: {
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        // See ADR-0004: null for missing or invisible.
        const me = await viewerProfile(ctx)
        if (!me) {
            return null
        }
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            return null
        }
        const visible = await isRestaurantVisibleTo(ctx.db, me._id, restaurant)
        if (!visible) {
            return null
        }
        return collectSocialFor(ctx.db, args.restaurantId)
    },
})

export const listMyStatuses = query({
    args: {},
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        const rows = await ctx.db
            .query("interests")
            .withIndex("by_user", (q) => q.eq("userId", me._id))
            .collect()
        return rows.map((row) => ({ restaurantId: row.restaurantId, status: row.status }))
    },
})

export const getSummaries = query({
    // See ADR-0004: private lists stay unenumerable; callers page in 30s.
    args: {
        restaurantIds: v.array(v.id("restaurants")),
    },
    handler: async (ctx, args) => {
        if (args.restaurantIds.length > 30) {
            throw new Error("Too many restaurants requested")
        }
        const me = await viewerProfile(ctx)
        const userId = me?._id ?? null
        return Promise.all(
            args.restaurantIds.map(async (restaurantId) => {
                const restaurant = await ctx.db.get(restaurantId)
                if (!restaurant) {
                    return null
                }
                if (userId === null || !(await isRestaurantVisibleTo(ctx.db, userId, restaurant))) {
                    return null
                }
                const { interests } = await collectSocialFor(ctx.db, restaurantId)
                const counts = countReactions(
                    interests,
                    userId === null ? { kind: "signed-out" } : { kind: "signed-in", id: userId },
                )
                return {
                    restaurantId,
                    wantCount: counts.wantCount,
                    beenCount: counts.beenCount,
                    wanted: counts.wanted,
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
        const userId = await requireVisibleRestaurant(ctx, args.restaurantId)
        const existing = await ctx.db
            .query("interests")
            .withIndex("by_user_restaurant", (q) => q.eq("userId", userId).eq("restaurantId", args.restaurantId))
            .unique()
        if (existing) {
            if (existing.status === args.status) {
                await ctx.db.delete(existing._id)
                return null
            }
            await ctx.db.patch("interests", existing._id, { status: args.status, updatedAt: Date.now() })
            return existing._id
        }
        const interestId = await ctx.db.insert("interests", {
            restaurantId: args.restaurantId,
            userId,
            status: args.status,
            updatedAt: Date.now(),
        })
        return interestId
    },
})
