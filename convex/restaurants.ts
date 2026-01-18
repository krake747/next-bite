import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query(async (ctx) => ctx.db.query("restaurants").collect())

export const add = mutation({
    args: {
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.string(),
    },
    handler: async (ctx, args) => ctx.db.insert("restaurants", args),
})

export const update = mutation({
    args: {
        id: v.id("restaurants"),
        name: v.optional(v.string()),
        cuisine: v.optional(v.string()),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
        link: v.optional(v.string()),
        addedBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args
        return ctx.db.patch(id, updates)
    },
})
