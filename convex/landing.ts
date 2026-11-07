import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Doc } from "./_generated/dataModel"
import { query } from "./_generated/server"
import { STATS_COUNTER_KEY } from "./helpers"

const topCuisineValidator = v.object({ cuisine: v.string(), count: v.number() })
const recentAddValidator = v.object({ name: v.string(), cuisine: v.string(), createdAt: v.number() })

const statsValidator = v.object({
    totalRestaurants: v.number(),
    totalWants: v.number(),
    topCuisines: v.array(topCuisineValidator),
    recentAdds: v.array(recentAddValidator),
})

type Stats = {
    totalRestaurants: number
    totalWants: number
    topCuisines: { cuisine: string; count: number }[]
    recentAdds: { name: string; cuisine: string; createdAt: number }[]
}

function topCuisinesFrom(counts: Record<string, number>): Stats["topCuisines"] {
    return Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([cuisine, count]) => ({ cuisine, count }))
        .toSorted((a, b) => b.count - a.count || a.cuisine.localeCompare(b.cuisine))
        .slice(0, 5)
}

function recentAddsFrom(restaurants: Doc<"restaurants">[]): Stats["recentAdds"] {
    return restaurants.map((restaurant) => ({
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        createdAt: restaurant.createdAt,
    }))
}

// Fallback for deployments seeded before the counters table existed. Exact but unbounded;
// runs at most until the first write populates the counters, then never again.
async function computeStatsLive(db: GenericDatabaseReader<DataModel>): Promise<Stats> {
    const [restaurants, interests] = await Promise.all([
        db.query("restaurants").collect(),
        db.query("interests").collect(),
    ])
    const wants = interests.filter((row) => row.status === "want")

    const byCuisine = new Map<string, number>()
    for (const restaurant of restaurants) {
        byCuisine.set(restaurant.cuisine, (byCuisine.get(restaurant.cuisine) ?? 0) + 1)
    }

    const recentAdds = [...restaurants].toSorted((a, b) => b.createdAt - a.createdAt).slice(0, 3)

    return {
        totalRestaurants: restaurants.length,
        totalWants: wants.length,
        topCuisines: topCuisinesFrom(Object.fromEntries(byCuisine)),
        recentAdds: recentAddsFrom(recentAdds),
    }
}

// Public on purpose: aggregate counts only, no per-user or contact data leaves here.
export const getStats = query({
    args: {},
    returns: statsValidator,
    handler: async (ctx) => {
        const counters = await ctx.db
            .query("statsCounters")
            .withIndex("by_key", (q) => q.eq("key", STATS_COUNTER_KEY))
            .unique()
        if (!counters) {
            return computeStatsLive(ctx.db)
        }
        const recentAdds = await ctx.db.query("restaurants").withIndex("by_created").order("desc").take(3)
        return {
            totalRestaurants: counters.restaurantCount,
            totalWants: counters.wantCount,
            topCuisines: topCuisinesFrom(counters.cuisineCounts),
            recentAdds: recentAddsFrom(recentAdds),
        }
    },
})
