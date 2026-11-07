import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireMembership, requireUserId } from "./helpers"
import { isRestaurantVisibleTo } from "./visibility"

const planStatusValidator = v.union(v.literal("planned"), v.literal("done"), v.literal("cancelled"))

type PlanDb = { db: GenericDatabaseReader<DataModel> }

async function ensureAcceptedFriend(ctx: PlanDb, creator: string, candidate: string): Promise<boolean> {
    if (candidate === creator) {
        return true
    }
    const forward = await ctx.db
        .query("friendships")
        .withIndex("by_owner_friend", (q) => q.eq("ownerId", creator).eq("friendAuthUserId", candidate))
        .unique()
    if (forward?.status === "accepted") {
        return true
    }
    const backward = await ctx.db
        .query("friendships")
        .withIndex("by_owner_friend", (q) => q.eq("ownerId", candidate).eq("friendAuthUserId", creator))
        .unique()
    return backward?.status === "accepted"
}

async function validatePlanTarget(
    ctx: PlanDb,
    userId: string,
    groupId: Id<"groups"> | undefined,
    restaurantId: Id<"restaurants"> | undefined,
): Promise<void> {
    if (groupId !== undefined) {
        await requireMembership(ctx.db, groupId, userId)
    }
    if (restaurantId !== undefined) {
        const restaurant = await ctx.db.get(restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (!(await isRestaurantVisibleTo(ctx.db, userId, restaurant))) {
            throw new Error("Unauthorized: restaurant is not shared with you")
        }
    }
}

async function validatePlanParticipants(
    ctx: PlanDb,
    userId: string,
    groupId: Id<"groups"> | undefined,
    participantIds: ReadonlyArray<string> | undefined,
): Promise<string[]> {
    const requested = [...new Set(participantIds ?? [])].slice(0, 20)
    const validated: string[] = []
    for (const candidate of requested) {
        if (candidate === userId || validated.includes(candidate)) {
            continue
        }
        if (groupId !== undefined) {
            const membership = await ctx.db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", candidate))
                .unique()
            if (!membership) {
                throw new Error("Unauthorized: every participant must belong to the group")
            }
        } else if (!(await ensureAcceptedFriend(ctx, userId, candidate))) {
            throw new Error("Unauthorized: every participant must be an accepted friend")
        }
        validated.push(candidate)
    }
    return validated
}

export const createPlan = mutation({
    args: {
        groupId: v.optional(v.id("groups")),
        restaurantId: v.optional(v.id("restaurants")),
        title: v.string(),
        date: v.number(),
        participantIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        if (args.groupId === undefined && args.restaurantId === undefined) {
            throw new Error("A plan needs a group, a restaurant, or both")
        }
        const title = args.title.trim().slice(0, 80)
        if (title === "") {
            throw new Error("Plan title is required")
        }
        if (!Number.isFinite(args.date) || args.date <= 0) {
            throw new Error("Plan date is required")
        }
        await validatePlanTarget(ctx, userId, args.groupId, args.restaurantId)
        const validated = await validatePlanParticipants(ctx, userId, args.groupId, args.participantIds)
        const planId = await ctx.db.insert("plans", {
            ...(args.groupId !== undefined ? { groupId: args.groupId } : {}),
            ...(args.restaurantId !== undefined ? { restaurantId: args.restaurantId } : {}),
            createdBy: userId,
            title,
            date: args.date,
            status: "planned",
            createdAt: Date.now(),
        })
        const participants = [...new Set([userId, ...validated])]
        for (const participant of participants) {
            await ctx.db.insert("planParticipants", { planId, userId: participant, joinedAt: Date.now() })
        }
        return planId
    },
})

export const listPlansForGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        await requireMembership(ctx.db, args.groupId, userId)
        const plans = await ctx.db
            .query("plans")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect()
        return Promise.all(
            plans
                .toSorted((a, b) => a.date - b.date)
                .map(async (plan) => {
                    const rows = await ctx.db
                        .query("planParticipants")
                        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
                        .collect()
                    const profiles = await Promise.all(
                        rows.map(async (row) =>
                            ctx.db
                                .query("profiles")
                                .withIndex("by_auth_user", (q) => q.eq("authUserId", row.userId))
                                .unique(),
                        ),
                    )
                    return Object.assign({}, plan, {
                        participants: rows.map((row, index) => ({
                            userId: row.userId,
                            name: profiles[index]?.name ?? "Someone",
                        })),
                    })
                }),
        )
    },
})

export const listPlansForRestaurant = query({
    args: {
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        if (!(await isRestaurantVisibleTo(ctx.db, userId, restaurant))) {
            throw new Error("Unauthorized: restaurant is not shared with you")
        }
        const plans = await ctx.db
            .query("plans")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .take(50)
        const visiblePlans: typeof plans = []
        for (const plan of plans) {
            const groupId = plan.groupId
            if (groupId === undefined) {
                visiblePlans.push(plan)
                continue
            }
            const membership = await ctx.db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
                .unique()
            if (membership) {
                visiblePlans.push(plan)
            }
        }
        return Promise.all(
            visiblePlans
                .toSorted((a, b) => a.date - b.date)
                .map(async (plan) => {
                    const rows = await ctx.db
                        .query("planParticipants")
                        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
                        .collect()
                    const profiles = await Promise.all(
                        rows.map(async (row) =>
                            ctx.db
                                .query("profiles")
                                .withIndex("by_auth_user", (q) => q.eq("authUserId", row.userId))
                                .unique(),
                        ),
                    )
                    return Object.assign({}, plan, {
                        participants: rows.map((row, index) => ({
                            userId: row.userId,
                            name: profiles[index]?.name ?? "Someone",
                        })),
                    })
                }),
        )
    },
})

export const updatePlanStatus = mutation({
    args: {
        planId: v.id("plans"),
        status: planStatusValidator,
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const plan = await ctx.db.get(args.planId)
        if (!plan) {
            throw new Error("Plan not found")
        }
        if (plan.groupId !== undefined) {
            const membership = await requireMembership(ctx.db, plan.groupId, userId)
            if (plan.createdBy !== userId && membership.role !== "admin") {
                throw new Error("Unauthorized: only the organizer or a group admin can update this plan")
            }
        } else if (plan.createdBy !== userId) {
            throw new Error("Unauthorized: only the organizer can update this plan")
        }
        await ctx.db.patch(args.planId, { status: args.status })
        return args.planId
    },
})
