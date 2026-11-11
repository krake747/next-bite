import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"

import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"

type PlacesDb = GenericDatabaseReader<DataModel>
type PlacesWriter = GenericDatabaseWriter<DataModel>

export async function imageClaim(db: PlacesDb, storageId: Id<"_storage">): Promise<Doc<"restaurantImages"> | null> {
    return db
        .query("restaurantImages")
        .withIndex("by_storage", (q) => q.eq("storageId", storageId))
        .first()
}

export async function claimImage(
    db: PlacesWriter,
    storageId: Id<"_storage">,
    restaurantId: Id<"restaurants">,
): Promise<void> {
    await db.insert("restaurantImages", { storageId, restaurantId })
}

export async function releaseImage(db: PlacesWriter, storageId: Id<"_storage">): Promise<void> {
    const claim = await imageClaim(db, storageId)
    if (claim !== null) {
        await db.delete("restaurantImages", claim._id)
    }
}

export async function claimLegacyImages(db: PlacesWriter, restaurant: Doc<"restaurants">): Promise<number> {
    let claimed = 0
    for (const image of restaurant.images) {
        const exists = (await db.system.get("_storage", image.storageId)) !== null
        if (exists && (await imageClaim(db, image.storageId)) === null) {
            await claimImage(db, image.storageId, restaurant._id)
            claimed += 1
        }
    }
    return claimed
}
