import { type GenericDatabaseReader } from "convex/server"

import { FALLBACK_DISPLAY_NAME } from "../src/core/constants"
import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { authComponent } from "./auth"
import { getProfiles, nameOf } from "./model/identity/profiles"

export { FALLBACK_DISPLAY_NAME } from "../src/core/constants"

export const FALLBACK_GROUP_NAME = "Unknown group"

export function formatDisplayName(raw: string | null | undefined, fallbackEmail?: string): string {
    const trimmed = (raw ?? fallbackEmail ?? "").trim().slice(0, 60)
    return trimmed === "" ? FALLBACK_DISPLAY_NAME : trimmed
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
    userId: Id<"profiles">,
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

export async function requireOwnedRestaurant(
    db: GenericDatabaseReader<DataModel>,
    id: Id<"restaurants">,
    profileId: Id<"profiles">,
): Promise<Doc<"restaurants">> {
    const restaurant = await db.get(id)
    if (!restaurant) {
        throw new Error("Restaurant not found")
    }
    if (restaurant.ownerId !== profileId) {
        throw new Error("Unauthorized: only the owner can change this restaurant")
    }
    return restaurant
}

export type RestaurantView = Doc<"restaurants"> & { ownerName: string }

export async function withOwnerNames(
    db: GenericDatabaseReader<DataModel>,
    restaurants: ReadonlyArray<Doc<"restaurants">>,
): Promise<RestaurantView[]> {
    const names = await getProfiles(
        db,
        restaurants.map((restaurant) => restaurant.ownerId),
    )
    return restaurants.map((restaurant) => ({ ...restaurant, ownerName: nameOf(names, restaurant.ownerId) }))
}
