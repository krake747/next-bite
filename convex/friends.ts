import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query(async (ctx) => ctx.db.query("friends").collect())

export const add = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => ctx.db.insert("friends", args),
})
