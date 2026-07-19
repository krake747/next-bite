import { mutation } from "./_generated/server"

export const seed = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("friends").first()
        if (!existing) {
            await ctx.db.insert("friends", { name: "Matt" })
        }
    },
})

export const cleanup = mutation({
    handler: async (ctx) => {
        const db = ctx.db as unknown as {
            query: (tableName: string) => { collect: () => Promise<{ _id: any; email?: string }[]> }
            delete: (id: any) => Promise<void>
        }

        const allUsers = await db.query("user").collect()
        const testUsers = allUsers.filter((u) => u.email?.startsWith("e2e-"))

        for (const user of testUsers) {
            await db.delete(user._id)
        }
    },
})
