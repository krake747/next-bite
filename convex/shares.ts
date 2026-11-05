import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireMembership } from "./groups"
import { requireUserId } from "./helpers"
import { requireOwnedRestaurant } from "./restaurants"
import { shareTargetValidator } from "./validators"

type ShareTarget = Doc<"restaurantShares">["target"]

export async function isRestaurantVisibleTo(
    db: GenericDatabaseReader<DataModel>,
    userId: string,
    restaurant: Doc<"restaurants">,
): Promise<boolean> {
    if (restaurant.ownerId === userId) {
        return true
    }
    const shares = await db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
        .collect()
    for (const share of shares) {
        const target = share.target
        if (target.kind === "user" && target.userId === userId) {
            return true
        }
        if (target.kind === "group") {
            const membership = await db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", target.groupId).eq("userId", userId))
                .unique()
            if (membership) {
                return true
            }
        }
    }
    return false
}

async function requireTargetUser(ctx: { db: GenericDatabaseReader<DataModel> }, userId: string): Promise<void> {
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
        .unique()
    if (!profile) {
        throw new Error("User not found")
    }
}

function sameTarget(a: ShareTarget, b: ShareTarget): boolean {
    if (a.kind === "user" && b.kind === "user") {
        return a.userId === b.userId
    }
    if (a.kind === "group" && b.kind === "group") {
        return a.groupId === b.groupId
    }
    return false
}

export const shareWithUser = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const restaurant = await requireOwnedRestaurant(ctx, args.restaurantId)
        if (args.userId === restaurant.ownerId) {
            throw new Error("Restaurant is already yours")
        }
        await requireTargetUser(ctx, args.userId)
        const target: ShareTarget = { kind: "user", userId: args.userId }
        const existing = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        const match = existing.find((share) => sameTarget(share.target, target))
        if (match) {
            return match._id
        }
        return ctx.db.insert("restaurantShares", {
            restaurantId: args.restaurantId,
            sharedBy: restaurant.ownerId,
            target,
            createdAt: Date.now(),
        })
    },
})

export const shareWithGroup = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await requireOwnedRestaurant(ctx, args.restaurantId)
        await requireMembership(ctx.db, args.groupId, userId)
        const target: ShareTarget = { kind: "group", groupId: args.groupId }
        const existing = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        const match = existing.find((share) => sameTarget(share.target, target))
        if (match) {
            return match._id
        }
        return ctx.db.insert("restaurantShares", {
            restaurantId: args.restaurantId,
            sharedBy: restaurant.ownerId,
            target,
            createdAt: Date.now(),
        })
    },
})

export const unshare = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        target: shareTargetValidator,
    },
    handler: async (ctx, args) => {
        await requireOwnedRestaurant(ctx, args.restaurantId)
        const existing = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        const match = existing.find((share) => sameTarget(share.target, args.target))
        if (!match) {
            throw new Error("Share not found")
        }
        await ctx.db.delete(match._id)
        return match._id
    },
})

export const listShares = query({
    args: {
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        await requireOwnedRestaurant(ctx, args.restaurantId)
        const shares = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        return Promise.all(
            shares.map(async (share) => {
                const target = share.target
                if (target.kind === "user") {
                    const profile = await ctx.db
                        .query("profiles")
                        .withIndex("by_auth_user", (q) => q.eq("authUserId", target.userId))
                        .unique()
                    return { _id: share._id, target, displayName: profile?.name ?? "Someone" }
                }
                const group = await ctx.db.get(target.groupId)
                return { _id: share._id, target, displayName: group?.name ?? "Unknown group" }
            }),
        )
    },
})
