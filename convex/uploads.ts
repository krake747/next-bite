import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc, type Id } from "./_generated/dataModel"
import { internalMutation, internalQuery } from "./_generated/server"

async function findUploadByStorage(
    db: GenericDatabaseReader<DataModel>,
    storageId: Id<"_storage">,
): Promise<Doc<"uploads"> | null> {
    return db
        .query("uploads")
        .withIndex("by_storage", (q) => q.eq("storageId", storageId))
        .unique()
}

export const lookupByStorage = internalQuery({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (!existing) {
            return null
        }
        return {
            ownerId: existing.ownerId,
            restaurantId: existing.restaurantId ?? null,
            purpose: existing.purpose ?? null,
            expiresAt: existing.expiresAt ?? null,
            mimeType: existing.mimeType ?? null,
            byteSize: existing.byteSize ?? null,
        }
    },
})

const TRANSIENT_TTL_MS = 24 * 60 * 60 * 1000

export const record = internalMutation({
    args: {
        storageId: v.id("_storage"),
        ownerId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (existing) {
            return existing._id
        }
        // Server-observed blob metadata: content type and size come from the
        // platform's storage record, never from client claims. New uploads start
        // as transient with a 24h expiry so failed flows leave collectable rows.
        const stored = await ctx.db.system.get("_storage", args.storageId)
        const mimeType = typeof stored?.contentType === "string" ? stored.contentType : undefined
        const byteSize = typeof stored?.size === "number" ? stored.size : undefined
        return ctx.db.insert("uploads", {
            storageId: args.storageId,
            ownerId: args.ownerId,
            purpose: "transient",
            expiresAt: Date.now() + TRANSIENT_TTL_MS,
            ...(mimeType !== undefined ? { mimeType } : {}),
            ...(byteSize !== undefined ? { byteSize } : {}),
            createdAt: Date.now(),
        })
    },
})

export const removeRecord = internalMutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (existing) {
            await ctx.db.delete(existing._id)
        }
    },
})

export const attach = internalMutation({
    args: {
        storageId: v.id("_storage"),
        ownerId: v.string(),
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (!existing || existing.ownerId !== args.ownerId) {
            throw new Error("Unauthorized: storage does not belong to you")
        }
        if (existing.restaurantId !== undefined && existing.restaurantId !== args.restaurantId) {
            throw new Error("Storage is already attached to another restaurant")
        }
        await ctx.db.patch(existing._id, {
            restaurantId: args.restaurantId,
            purpose: "restaurant",
            expiresAt: undefined,
        })
    },
})

export const setPurpose = internalMutation({
    args: {
        storageId: v.id("_storage"),
        ownerId: v.string(),
        purpose: v.union(v.literal("group"), v.literal("avatar")),
    },
    handler: async (ctx, args) => {
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (!existing || existing.ownerId !== args.ownerId) {
            throw new Error("Unauthorized: storage does not belong to you")
        }
        await ctx.db.patch(existing._id, { purpose: args.purpose, expiresAt: undefined })
    },
})

export const detach = internalMutation({
    args: {
        storageId: v.id("_storage"),
        ownerId: v.string(),
    },
    handler: async (ctx, args) => {
        // Best-effort dissociation: only clears the association when the record exists and the
        // owner matches. Missing or foreign records are left alone so dropping a legacy image
        // from a restaurant never fails and never touches another owner's data.
        const existing = await findUploadByStorage(ctx.db, args.storageId)
        if (!existing || existing.ownerId !== args.ownerId) {
            return
        }
        if (existing.restaurantId !== undefined) {
            await ctx.db.patch(existing._id, { restaurantId: undefined })
        }
    },
})
