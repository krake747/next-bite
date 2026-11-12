import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireProfile, signedInProfile } from "./model/identity/profiles"
import { cancelPlanRecord, createPlanRecord, forGroupPlans, planViewValidator } from "./model/plans/plans"

export const forGroup = query({
    args: { groupId: v.id("groups") },
    returns: v.array(planViewValidator),
    handler: async (ctx, args) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return forGroupPlans(ctx.db, me._id, args.groupId)
    },
})

export const create = mutation({
    args: {
        groupId: v.id("groups"),
        placeId: v.id("places"),
        startsAt: v.number(),
    },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return createPlanRecord(ctx.db, me._id, args.groupId, args.placeId, args.startsAt)
    },
})

export const cancel = mutation({
    args: { planId: v.id("plans") },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return cancelPlanRecord(ctx.db, me._id, args.planId)
    },
})
