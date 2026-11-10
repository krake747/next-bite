import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"

import { FALLBACK_DISPLAY_NAME } from "../src/core/constants"
import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { authComponent } from "./auth"

export { FALLBACK_DISPLAY_NAME } from "../src/core/constants"

export const FALLBACK_GROUP_NAME = "Unknown group"

export function formatDisplayName(raw: string | null | undefined, fallbackEmail?: string): string {
    const trimmed = (raw ?? fallbackEmail ?? "").trim().slice(0, 60)
    return trimmed === "" ? FALLBACK_DISPLAY_NAME : trimmed
}

export async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}

export type AuthUserRecord = {
    name?: string | null | undefined
    email?: string | null | undefined
}

export async function readAuthUser(
    ctx: Parameters<typeof authComponent.getAuthUser>[0],
): Promise<AuthUserRecord | undefined> {
    try {
        return await authComponent.getAuthUser(ctx)
    } catch {
        return undefined
    }
}

export async function requireMembership(
    db: GenericDatabaseReader<DataModel>,
    groupId: Id<"groups">,
    userId: string,
): Promise<Doc<"groupMembers">> {
    const group = await db.get(groupId)
    if (!group) {
        throw new Error("Group not found")
    }
    const membership = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (!membership) {
        throw new Error("Unauthorized: group membership required")
    }
    return membership
}

export const STATS_COUNTER_KEY = "global"

export type StatsDelta = {
    readonly restaurants?: number | undefined
    readonly wants?: number | undefined
    readonly cuisines?: Readonly<Record<string, number>> | undefined
}

export async function adjustStatsCounters(
    ctx: { db: GenericDatabaseReader<DataModel> & GenericDatabaseWriter<DataModel> },
    delta: StatsDelta,
): Promise<void> {
    const existing = await ctx.db
        .query("statsCounters")
        .withIndex("by_key", (q) => q.eq("key", STATS_COUNTER_KEY))
        .unique()
    const cuisineCounts: Record<string, number> = { ...existing?.cuisineCounts }
    for (const [cuisine, change] of Object.entries(delta.cuisines ?? {})) {
        cuisineCounts[cuisine] = Math.max(0, (cuisineCounts[cuisine] ?? 0) + change)
    }
    const row = {
        key: STATS_COUNTER_KEY,
        restaurantCount: Math.max(0, (existing?.restaurantCount ?? 0) + (delta.restaurants ?? 0)),
        wantCount: Math.max(0, (existing?.wantCount ?? 0) + (delta.wants ?? 0)),
        cuisineCounts,
    }
    if (existing) {
        await ctx.db.patch(existing._id, row)
    } else {
        await ctx.db.insert("statsCounters", row)
    }
}

type DbGet = {
    get: (id: Id<"restaurants">) => Promise<Doc<"restaurants"> | null>
}

type AuthCtx = {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}

export async function requireOwnedRestaurant(
    ctx: AuthCtx & { db: DbGet },
    id: Id<"restaurants">,
): Promise<Doc<"restaurants">> {
    const userId = await requireUserId(ctx)
    const restaurant = await ctx.db.get(id)
    if (!restaurant) {
        throw new Error("Restaurant not found")
    }
    if (restaurant.ownerId !== userId) {
        throw new Error("Unauthorized: only the owner can change this restaurant")
    }
    return restaurant
}
