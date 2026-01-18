import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query(async (ctx) => ctx.db.query("restaurants").collect())

export const add = mutation({
    args: {
        name: v.string(),
        cuisine: v.string(),
        location: v.string(),
        notes: v.optional(v.string()),
        addedBy: v.string(),
    },
    handler: async (ctx, args) =>
        ctx.db.insert("restaurants", {
            ...args,
            createdAt: Date.now(),
        }),
})


