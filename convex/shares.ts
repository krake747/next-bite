import { v } from "convex/values"

import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { FALLBACK_GROUP_NAME, requireMembership, requireOwnedRestaurant, requireUserId } from "./helpers"
import { groupShareTargetValidator } from "./validators"

type GroupTarget = { kind: "group"; groupId: Id<"groups"> }

function isGroupTarget(target: Doc<"restaurantShares">["target"], groupId: Id<"groups">): boolean {
    return target.kind === "group" && target.groupId === groupId
}

async function upsertShare(
    ctx: MutationCtx,
    restaurantId: Id<"restaurants">,
    sharedBy: string,
    target: GroupTarget,
): Promise<Id<"restaurantShares">> {
    const existing = await ctx.db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
        .collect()
    const match = existing.find((share) => isGroupTarget(share.target, target.groupId))
    if (match) {
        return match._id
    }
    return ctx.db.insert("restaurantShares", {
        restaurantId,
        sharedBy,
        target,
        targetGroupId: target.groupId,
        createdAt: Date.now(),
    })
}

export const shareWithGroup = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await requireOwnedRestaurant(ctx, args.restaurantId)
        await requireMembership(ctx.db, args.groupId, userId)
        return upsertShare(ctx, args.restaurantId, restaurant.ownerId, { kind: "group", groupId: args.groupId })
    },
})

export const unshare = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        target: groupShareTargetValidator,
    },
    handler: async (ctx, args) => {
        await requireOwnedRestaurant(ctx, args.restaurantId)
        const existing = await ctx.db
            .query("restaurantShares")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .collect()
        const match = existing.find((share) => isGroupTarget(share.target, args.target.groupId))
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
            shares.flatMap((share) => {
                const target = share.target
                if (target.kind !== "group") {
                    return []
                }
                return [
                    ctx.db.get(target.groupId).then((group) => ({
                        _id: share._id,
                        target,
                        displayName: group?.name ?? FALLBACK_GROUP_NAME,
                    })),
                ]
            }),
        )
    },
})

export const listForGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        await requireMembership(ctx.db, args.groupId, userId)
        const shares = await ctx.db
            .query("restaurantShares")
            .withIndex("by_target_group", (q) => q.eq("targetGroupId", args.groupId))
            .collect()
        const restaurants = await Promise.all(shares.map(async (share) => ctx.db.get(share.restaurantId)))
        return restaurants.filter((restaurant) => restaurant !== null)
    },
})
