import { v } from "convex/values"

import { query } from "./_generated/server"

const topCuisineValidator = v.object({ cuisine: v.string(), count: v.number() })
const recentAddValidator = v.object({ name: v.string(), cuisine: v.string(), createdAt: v.number() })

// Public on purpose: aggregate counts only, no per-user or contact data leaves here.
export const getStats = query({
    args: {},
    returns: v.object({
        totalRestaurants: v.number(),
        totalWants: v.number(),
        topCuisines: v.array(topCuisineValidator),
        recentAdds: v.array(recentAddValidator),
    }),
    handler: async (ctx) => {
        const [restaurants, interests] = await Promise.all([
            ctx.db.query("restaurants").collect(),
            ctx.db.query("interests").collect(),
        ])
        const wants = interests.filter((row) => row.status === "want")

        const byCuisine = new Map<string, number>()
        for (const restaurant of restaurants) {
            byCuisine.set(restaurant.cuisine, (byCuisine.get(restaurant.cuisine) ?? 0) + 1)
        }
        const topCuisines = [...byCuisine.entries()]
            .map(([cuisine, count]) => ({ cuisine, count }))
            .toSorted((a, b) => b.count - a.count || a.cuisine.localeCompare(b.cuisine))
            .slice(0, 5)

        const recentAdds = [...restaurants]
            .toSorted((a, b) => b.createdAt - a.createdAt)
            .slice(0, 3)
            .map((restaurant) => ({
                name: restaurant.name,
                cuisine: restaurant.cuisine,
                createdAt: restaurant.createdAt,
            }))

        return {
            totalRestaurants: restaurants.length,
            totalWants: wants.length,
            topCuisines,
            recentAdds,
        }
    },
})
