import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { requireMembership } from "./groups"
import { FALLBACK_GROUP_NAME, formatDisplayName, requireUserId } from "./helpers"
import { requireOwnedRestaurant } from "./restaurants"
import { shareTargetValidator } from "./validators"

type ShareTarget = Doc<"restaurantShares">["target"]

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

async function upsertShare(
    ctx: MutationCtx,
    restaurantId: Id<"restaurants">,
    sharedBy: string,
    target: ShareTarget,
): Promise<Id<"restaurantShares">> {
    const existing = await ctx.db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
        .collect()
    const match = existing.find((share) => sameTarget(share.target, target))
    if (match) {
        return match._id
    }
    return ctx.db.insert("restaurantShares", {
        restaurantId,
        sharedBy,
        target,
        createdAt: Date.now(),
    })
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
        return upsertShare(ctx, args.restaurantId, restaurant.ownerId, target)
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
        return upsertShare(ctx, args.restaurantId, restaurant.ownerId, target)
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
                    return { _id: share._id, target, displayName: formatDisplayName(profile?.name) }
                }
                const group = await ctx.db.get(target.groupId)
                return { _id: share._id, target, displayName: group?.name ?? FALLBACK_GROUP_NAME }
            }),
        )
    },
})
