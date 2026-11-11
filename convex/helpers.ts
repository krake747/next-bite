import { type GenericDatabaseReader } from "convex/server"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { authComponent } from "./auth"
import { getProfiles, nameOf } from "./model/identity/profiles"

export { FALLBACK_DISPLAY_NAME } from "../src/core/constants"
export { requireMember as requireMembership } from "./model/groups/memberships"

export const FALLBACK_GROUP_NAME = "Unknown group"

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
