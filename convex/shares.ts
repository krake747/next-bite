import { v } from "convex/values"

import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { FALLBACK_GROUP_NAME, requireMembership, requireOwnedRestaurant, withOwnerNames } from "./helpers"
import { requireProfile, signedInProfile } from "./model/identity/profiles"
import { shareTargetValidator } from "./validators"

type GroupTarget = Doc<"restaurantShares">["target"]

async function upsertShare(
    ctx: MutationCtx,
    restaurantId: Id<"restaurants">,
    sharedBy: Id<"profiles">,
    target: GroupTarget,
): Promise<Id<"restaurantShares">> {
    const existing = await ctx.db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
        .collect()
    const match = existing.find((share) => share.target.groupId === target.groupId)
    if (match) {
        return match._id
    }
    return ctx.db.insert("restaurantShares", {
        restaurantId,
        sharedBy,
        target,
        targetGroupId: target.groupId,
    })
}

export const shareWithGroup = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        const restaurant = await requireOwnedRestaurant(ctx.db, args.restaurantId, userId)
        await requireMembership(ctx.db, args.groupId, userId)
        return upsertShare(ctx, args.restaurantId, restaurant.ownerId, { kind: "group", groupId: args.groupId })
    },
})

export const unshare = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        target: shareTargetValidator,
    },
    handler: async (ctx, args) => {
        await requireOwnedRestaurant(ctx.db, args.restaurantId, (await requireProfile(ctx))._id)
        const existing = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        const match = existing.find((share) => share.target.groupId === args.target.groupId)
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
        await requireOwnedRestaurant(ctx.db, args.restaurantId, (await requireProfile(ctx))._id)
        const shares = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        return Promise.all(
            shares.map(async (share) => {
                const group = await ctx.db.get(share.target.groupId)
                return { _id: share._id, target: share.target, displayName: group?.name ?? FALLBACK_GROUP_NAME }
            }),
        )
    },
})

export const listForGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const me = await signedInProfile(ctx)
        if (!me) {
            return []
        }
        await requireMembership(ctx.db, args.groupId, me._id)
        const shares = await ctx.db
            .query("restaurantShares")
            .withIndex("by_target_group", (q) => q.eq("targetGroupId", args.groupId))
            .collect()
        const restaurants = await Promise.all(shares.map(async (share) => ctx.db.get(share.restaurantId)))
        return withOwnerNames(
            ctx.db,
            restaurants.filter((restaurant) => restaurant !== null),
        )
    },
})
