import { type GenericDatabaseReader } from "convex/server"

import { type DataModel, type Doc } from "./_generated/dataModel"

export async function isRestaurantVisibleTo(
    db: GenericDatabaseReader<DataModel>,
    userId: string,
    restaurant: Doc<"restaurants">,
): Promise<boolean> {
    if (restaurant.ownerId === userId) {
        return true
    }
    const shares = await db
        .query("restaurantShares")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
        .collect()
    for (const share of shares) {
        const target = share.target
        if (target.kind === "user" && target.userId === userId) {
            return true
        }
        if (target.kind === "group") {
            const membership = await db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", target.groupId).eq("userId", userId))
                .unique()
            if (membership) {
                return true
            }
        }
    }
    return false
}
