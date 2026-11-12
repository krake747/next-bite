import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { type DataModel, type Id } from "./_generated/dataModel"
import { internalMutation, internalQuery, mutation, type QueryCtx } from "./_generated/server"
import { requireProfile } from "./model/identity/profiles"
import { isStorageClaimed, photoMetadata } from "./model/places/photos"

export const UNCLAIMED_TTL_MS = 24 * 60 * 60 * 1000
export const CLEANUP_PAGE_SIZE = 100

export type StoredImage = {
    readonly mimeType: string
    readonly byteSize: number
}

export const storedImageValidator = v.object({ mimeType: v.string(), byteSize: v.number() })

type StorageCtx = Pick<QueryCtx, "db">

export async function storedImage(ctx: StorageCtx, storageId: Id<"_storage">): Promise<StoredImage> {
    return photoMetadata(ctx.db, storageId)
}

export async function isClaimed(db: GenericDatabaseReader<DataModel>, storageId: Id<"_storage">): Promise<boolean> {
    return isStorageClaimed(db, storageId)
}

export async function claimableImage(ctx: StorageCtx, storageId: Id<"_storage">): Promise<StoredImage> {
    const image = await storedImage(ctx, storageId)
    if (await isClaimed(ctx.db, storageId)) {
        throw new Error("Storage is already claimed")
    }
    return image
}

export const deleteUpload = mutation({
    args: { storageId: v.id("_storage") },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireProfile(ctx)
        if (await isClaimed(ctx.db, args.storageId)) {
            throw new Error("Storage is already claimed")
        }
        if ((await ctx.db.system.get("_storage", args.storageId)) !== null) {
            await ctx.storage.delete(args.storageId)
        }
        return null
    },
})

export const generateUploadUrl = mutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        await requireProfile(ctx)
        return ctx.storage.generateUploadUrl()
    },
})

export const _storedImage = internalQuery({
    args: { storageId: v.id("_storage") },
    returns: storedImageValidator,
    handler: async (ctx, args) => storedImage(ctx, args.storageId),
})

export const cleanupUnclaimed = internalMutation({
    args: { cursor: v.union(v.string(), v.null()) },
    returns: v.object({ checked: v.number(), deleted: v.number() }),
    handler: async (ctx, args) => {
        const cutoff = Date.now() - UNCLAIMED_TTL_MS
        const page = await ctx.db.system
            .query("_storage")
            .paginate({ numItems: CLEANUP_PAGE_SIZE, cursor: args.cursor })
        let deleted = 0
        for (const file of page.page) {
            if (file._creationTime >= cutoff || (await isClaimed(ctx.db, file._id))) {
                continue
            }
            await ctx.storage.delete(file._id)
            deleted += 1
        }
        if (!page.isDone) {
            await ctx.scheduler.runAfter(0, internal.storage.cleanupUnclaimed, { cursor: page.continueCursor })
        }
        return { checked: page.page.length, deleted }
    },
})
