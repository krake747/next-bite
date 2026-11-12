import { type GenericDatabaseReader, type GenericDatabaseWriter, type StorageWriter } from "convex/server"

import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "../../../src/core/constants"
import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { avatarHolder } from "../identity/profiles"

type PhotoDb = GenericDatabaseReader<DataModel>
type PhotoWriter = GenericDatabaseWriter<DataModel>
type PhotoCtx = { readonly db: PhotoWriter; readonly storage: StorageWriter }

export type PhotoInput = {
    readonly storageId: Id<"_storage">
    readonly width?: number
    readonly height?: number
}

export async function photoMetadata(
    db: GenericDatabaseReader<DataModel>,
    storageId: Id<"_storage">,
): Promise<{ readonly mimeType: string; readonly byteSize: number }> {
    const file = await db.system.get("_storage", storageId)
    if (file === null) {
        throw new Error("Upload not found")
    }
    const mimeType = file.contentType ?? ""
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        throw new Error(`Invalid content type. Must be one of: ${[...ALLOWED_IMAGE_TYPES].join(", ")}`)
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`)
    }
    return { mimeType, byteSize: file.size }
}

export async function photoClaim(db: PhotoDb, storageId: Id<"_storage">): Promise<Doc<"photos"> | null> {
    return db
        .query("photos")
        .withIndex("by_storage", (q) => q.eq("storageId", storageId))
        .unique()
}

export async function isStorageClaimed(db: PhotoDb, storageId: Id<"_storage">): Promise<boolean> {
    if ((await avatarHolder(db, storageId)) !== null) {
        return true
    }
    return (await photoClaim(db, storageId)) !== null
}

export async function claimPhoto(ctx: PhotoCtx, placeId: Id<"places">, input: PhotoInput): Promise<Doc<"photos">> {
    const { mimeType, byteSize } = await photoMetadata(ctx.db, input.storageId)
    if (await isStorageClaimed(ctx.db, input.storageId)) {
        throw new Error("Storage is already claimed")
    }
    const url = await ctx.storage.getUrl(input.storageId)
    if (url === null) {
        throw new Error("Uploaded image is missing its URL")
    }
    const photoId = await ctx.db.insert("photos", {
        storageId: input.storageId,
        placeId,
        url,
        ...(input.width !== undefined ? { width: input.width } : {}),
        ...(input.height !== undefined ? { height: input.height } : {}),
        mimeType,
        byteSize,
    })
    const photo = await ctx.db.get("photos", photoId)
    if (photo === null) {
        throw new Error("Photo claim failed")
    }
    return photo
}

export async function releasePhoto(ctx: PhotoCtx, storageId: Id<"_storage">): Promise<void> {
    const claim = await photoClaim(ctx.db, storageId)
    if (claim !== null) {
        await ctx.db.delete("photos", claim._id)
        await ctx.storage.delete(storageId)
    }
}
