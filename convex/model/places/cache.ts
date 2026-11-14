import { type Infer, v } from "convex/values"

import { internalMutation, internalQuery } from "../../_generated/server"
import { googleCacheKindValidator, googleCachePayloadValidator } from "../../validators"

export type GoogleCacheKind = Infer<typeof googleCacheKindValidator>

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// Freshness per cached kind. Combined carries open state, so it expires fast;
// atmosphere extras move slowly. Every TTL sits under the 30-day Places
// caching allowance (see docs/migrations.md "Place coordinates").
export const GOOGLE_CACHE_TTL_MS: Record<GoogleCacheKind, number> = {
    "details-combined": DAY_MS,
    "details-atmosphere": 7 * DAY_MS,
    atmosphere: 7 * DAY_MS,
}

function isFresh(fetchedAt: number, kind: GoogleCacheKind, now: number): boolean {
    return now - fetchedAt < GOOGLE_CACHE_TTL_MS[kind]
}

export const readGoogleCache = internalQuery({
    args: { placeId: v.id("places"), kind: googleCacheKindValidator, now: v.number() },
    returns: v.union(googleCachePayloadValidator, v.null()),
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("googlePlaceCache")
            .withIndex("by_place_kind", (q) => q.eq("placeId", args.placeId).eq("kind", args.kind))
            .take(10)
        const fresh = rows.find((row) => isFresh(row.fetchedAt, row.kind, args.now))
        return fresh?.payload ?? null
    },
})

export const storeGoogleCache = internalMutation({
    args: {
        placeId: v.id("places"),
        kind: googleCacheKindValidator,
        payload: googleCachePayloadValidator,
        fetchedAt: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("googlePlaceCache")
            .withIndex("by_place_kind", (q) => q.eq("placeId", args.placeId).eq("kind", args.kind))
            .take(10)
        const [current, ...duplicates] = rows
        if (current === undefined) {
            await ctx.db.insert("googlePlaceCache", {
                placeId: args.placeId,
                kind: args.kind,
                payload: args.payload,
                fetchedAt: args.fetchedAt,
            })
        } else {
            await ctx.db.patch("googlePlaceCache", current._id, { payload: args.payload, fetchedAt: args.fetchedAt })
            for (const duplicate of duplicates) {
                await ctx.db.delete("googlePlaceCache", duplicate._id)
            }
        }
        return null
    },
})
