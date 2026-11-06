import { type GenericDatabaseReader } from "convex/server"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { authComponent } from "./auth"

export const FALLBACK_DISPLAY_NAME = "Someone"

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
