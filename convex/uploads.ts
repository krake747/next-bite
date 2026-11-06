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
