import { type GenericDatabaseReader } from "convex/server"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { areFriends } from "./model/social/friendships"

export async function isRestaurantVisibleTo(
    db: GenericDatabaseReader<DataModel>,
    viewerId: Id<"profiles">,
    restaurant: Doc<"restaurants">,
): Promise<boolean> {
    if (restaurant.ownerId === viewerId) {
        return true
    }
    if (await areFriends(db, restaurant.ownerId, viewerId)) {
        return true
    }
    const shares = await db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
        .collect()
    for (const share of shares) {
        const membership = await db
            .query("groupMembers")
            .withIndex("by_group_user", (q) => q.eq("groupId", share.target.groupId).eq("userId", viewerId))
            .unique()
        if (membership) {
            return true
        }
    }
    return false
}
