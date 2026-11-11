import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Id } from "../../_generated/dataModel"
import { groupOwnerId } from "../groups/groups"
import { requireMember } from "../groups/memberships"
import { getProfiles, nameOf } from "../identity/profiles"
import { isPlaceInGroup, placeNames } from "../places/places"
import { plansTables } from "./schema"

export const planValidator = v.object({
    _id: v.id("plans"),
    _creationTime: v.number(),
    ...plansTables.plans.validator.fields,
})

export const planViewValidator = v.object({
    _id: v.id("plans"),
    placeId: v.id("places"),
    placeName: v.string(),
    startsAt: v.number(),
    status: v.union(v.literal("planned"), v.literal("cancelled")),
    createdBy: v.id("profiles"),
    organizerName: v.string(),
})

export const GROUP_PLANS_TAKE = 200

export async function createPlanRecord(
    db: GenericDatabaseWriter<DataModel>,
    createdBy: Id<"profiles">,
    groupId: Id<"groups">,
    placeId: Id<"places">,
    startsAt: number,
): Promise<Id<"plans">> {
    if (!Number.isFinite(startsAt) || startsAt <= 0) {
        throw new Error("Plan time is required")
    }
    await requireMember(db, groupId, createdBy)
    if (!(await isPlaceInGroup(db, groupId, placeId))) {
        throw new Error("Place is not in this group")
    }
    return db.insert("plans", { groupId, placeId, createdBy, startsAt, status: "planned" })
}

export async function cancelPlanRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: Id<"profiles">,
    planId: Id<"plans">,
): Promise<Id<"plans">> {
    const plan = await db.get("plans", planId)
    if (plan === null) {
        throw new Error("Plan not found")
    }
    await requireMember(db, plan.groupId, userId)
    if (plan.createdBy !== userId && (await groupOwnerId(db, plan.groupId)) !== userId) {
        throw new Error("Unauthorized: only the organizer or the group owner can cancel this plan")
    }
    if (plan.status !== "cancelled") {
        await db.patch("plans", planId, { status: "cancelled" })
    }
    return planId
}

export async function forGroupPlans(
    db: GenericDatabaseReader<DataModel>,
    viewerId: Id<"profiles">,
    groupId: Id<"groups">,
) {
    await requireMember(db, groupId, viewerId)
    const plans = await db
        .query("plans")
        .withIndex("by_group_starts", (q) => q.eq("groupId", groupId))
        .take(GROUP_PLANS_TAKE)
    const names = await placeNames(
        db,
        plans.map((plan) => plan.placeId),
    )
    const organizers = await getProfiles(
        db,
        plans.map((plan) => plan.createdBy),
    )
    return plans.flatMap((plan) => {
        const placeName = names.get(plan.placeId)
        if (placeName === undefined) {
            return []
        }
        return [
            {
                _id: plan._id,
                placeId: plan.placeId,
                placeName,
                startsAt: plan.startsAt,
                status: plan.status,
                createdBy: plan.createdBy,
                organizerName: nameOf(organizers, plan.createdBy),
            },
        ]
    })
}
