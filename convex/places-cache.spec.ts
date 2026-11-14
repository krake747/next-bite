import { convexTest } from "convex-test"
/// <reference types="vite/client" />
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { server } from "../src/vitest.msw.setup"
import { api } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import { ENTERPRISE_FIELD_MASK, PRO_FIELD_MASK } from "./model/places/details"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

const GOOGLE_PLACE_ID = "ChIJcached"
const AUTH_USER_ID = "cache-user-1"

const savedApiKey = process.env.GOOGLE_MAPS_API_KEY

function maskUrl(placeId: string, mask: ReadonlyArray<string>): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${[...mask].join(",")}`
}

function enterprisePayload() {
    return {
        currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM - 5:00 PM"] },
        rating: 4.5,
        userRatingCount: 123,
        priceLevel: "PRICE_LEVEL_MODERATE",
        websiteUri: "https://example.com/trattoria",
    }
}

function proPayload() {
    return {
        businessStatus: "OPERATIONAL",
        displayName: { text: "Cached Place" },
    }
}

async function seedPlace(t: ReturnType<typeof convexTest>): Promise<Id<"places">> {
    return t.run(async (ctx) => {
        const owner = await ctx.db.insert("profiles", {
            authUserId: AUTH_USER_ID,
            name: "Cache Owner",
            email: "cache-owner@example.com",
        })
        return ctx.db.insert("places", {
            ownerId: owner,
            name: "Cached Place",
            address: { label: "Luxembourg City", google: { placeId: GOOGLE_PLACE_ID } },
        })
    })
}

describe("google place cache", () => {
    beforeEach(() => {
        process.env.GOOGLE_MAPS_API_KEY = "test-key"
    })

    afterEach(() => {
        if (savedApiKey === undefined) {
            delete process.env.GOOGLE_MAPS_API_KEY
        } else {
            process.env.GOOGLE_MAPS_API_KEY = savedApiKey
        }
    })

    test("enterprise details serve the cached row without a Google fetch", async () => {
        let fetches = 0
        server.use(
            http.get(maskUrl(GOOGLE_PLACE_ID, ENTERPRISE_FIELD_MASK), () => {
                fetches += 1
                return HttpResponse.json(enterprisePayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        const first = await authed.action(api.places.details, { placeId, tier: "enterprise" })
        expect(fetches).toBe(1)
        expect(first).toEqual({
            openingHours: { openState: "open", periods: [], weekdayText: ["Monday: 9:00 AM - 5:00 PM"] },
            rating: 4.5,
            ratingCount: 123,
            priceLevel: "PRICE_LEVEL_MODERATE",
            websiteUri: "https://example.com/trattoria",
        })

        const second = await authed.action(api.places.details, { placeId, tier: "enterprise" })
        expect(fetches).toBe(1)
        expect(second).toEqual(first)
    })

    test("pro tier serves the cached row without a Google refetch", async () => {
        let proFetches = 0
        server.use(
            http.get(maskUrl(GOOGLE_PLACE_ID, PRO_FIELD_MASK), () => {
                proFetches += 1
                return HttpResponse.json(proPayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        await authed.action(api.places.details, { placeId, tier: "pro" })
        expect(proFetches).toBe(1)
        await authed.action(api.places.details, { placeId, tier: "pro" })
        expect(proFetches).toBe(1)
    })

    test("empty results are not cached", async () => {
        let fetches = 0
        server.use(
            http.get(maskUrl(GOOGLE_PLACE_ID, PRO_FIELD_MASK), () => {
                fetches += 1
                return HttpResponse.json({})
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        await authed.action(api.places.details, { placeId, tier: "pro" })
        await authed.action(api.places.details, { placeId, tier: "pro" })
        expect(fetches).toBe(2)
    })

    test("details refetches and stores when the cached row is stale", async () => {
        let fetches = 0
        server.use(
            http.get(maskUrl(GOOGLE_PLACE_ID, ENTERPRISE_FIELD_MASK), () => {
                fetches += 1
                return HttpResponse.json(enterprisePayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        await t.run(async (ctx) => {
            await ctx.db.insert("googlePlaceCache", {
                placeId,
                kind: "details-enterprise",
                payload: {
                    openingHours: { openState: "unknown", periods: [], weekdayText: [] },
                },
                fetchedAt: 0,
            })
        })

        const result = await authed.action(api.places.details, { placeId, tier: "enterprise" })
        expect(fetches).toBe(1)
        expect(result).toMatchObject({ rating: 4.5 })
    })

    test("unauthenticated callers cannot read cached details", async () => {
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)

        await expect(t.action(api.places.details, { placeId, tier: "enterprise" })).rejects.toThrow("Unauthorized")
    })
})
