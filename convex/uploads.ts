import { v } from "convex/values"

import { internalMutation, internalQuery } from "./_generated/server"

export const ownerByStorage = internalQuery({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args): Promise<string | null> => {
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        return existing?.ownerId ?? null
    },
})

export const lookupByStorage = internalQuery({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        if (!existing) {
            return null
        }
        return { ownerId: existing.ownerId, restaurantId: existing.restaurantId ?? null }
    },
})

export const record = internalMutation({
    args: {
        storageId: v.string(),
        ownerId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        if (existing) {
            return existing._id
        }
        return ctx.db.insert("uploads", { storageId: args.storageId, ownerId: args.ownerId, createdAt: Date.now() })
    },
})

export const removeRecord = internalMutation({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        if (existing) {
            await ctx.db.delete(existing._id)
        }
    },
})

export const attach = internalMutation({
    args: {
        storageId: v.string(),
        ownerId: v.string(),
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        if (!existing || existing.ownerId !== args.ownerId) {
            throw new Error("Unauthorized: storage does not belong to you")
        }
        if (existing.restaurantId !== undefined && existing.restaurantId !== args.restaurantId) {
            throw new Error("Storage is already attached to another restaurant")
        }
        await ctx.db.patch(existing._id, { restaurantId: args.restaurantId })
    },
})

export const detach = internalMutation({
    args: {
        storageId: v.string(),
        ownerId: v.string(),
    },
    handler: async (ctx, args) => {
        // Best-effort dissociation: only clears the association when the record exists and the
        // owner matches. Missing or foreign records are left alone so dropping a legacy image
        // from a restaurant never fails and never touches another owner's data.
        const existing = await ctx.db
            .query("uploads")
            .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
            .unique()
        if (!existing || existing.ownerId !== args.ownerId) {
            return
        }
        if (existing.restaurantId !== undefined) {
            await ctx.db.patch(existing._id, { restaurantId: undefined })
        }
    },
})
