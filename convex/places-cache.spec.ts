import { convexTest } from "convex-test"
/// <reference types="vite/client" />
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { server } from "../src/vitest.msw.setup"
import { api } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import { ATMOSPHERE_MASK } from "./model/places/atmosphere"
import { COMBINED_FIELD_MASK } from "./model/places/details"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

const GOOGLE_PLACE_ID = "ChIJcached"
const AUTH_USER_ID = "cache-user-1"

const savedApiKey = process.env.GOOGLE_MAPS_API_KEY

function combinedUrl(placeId: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${COMBINED_FIELD_MASK.join(",")}`
}

function atmosphereUrl(placeId: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${ATMOSPHERE_MASK}`
}

function combinedPayload() {
    return {
        businessStatus: "OPERATIONAL",
        currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM - 5:00 PM"] },
        rating: 4.5,
        userRatingCount: 123,
        priceLevel: "PRICE_LEVEL_MODERATE",
        websiteUri: "https://example.com/trattoria",
    }
}

function atmospherePayload() {
    return {
        servesVegetarianFood: true,
        goodForGroups: true,
        reservable: false,
        editorialSummary: { text: "A cozy neighborhood spot.", languageCode: "en" },
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

    test("details serves the cached row without a Google fetch", async () => {
        let fetches = 0
        server.use(
            http.get(combinedUrl(GOOGLE_PLACE_ID), () => {
                fetches += 1
                return HttpResponse.json(combinedPayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        const first = await authed.action(api.places.details, { placeId, tier: "combined" })
        expect(fetches).toBe(1)
        expect(first).toEqual({
            businessStatus: "OPERATIONAL",
            openingHours: { openState: "open", periods: [], weekdayText: ["Monday: 9:00 AM - 5:00 PM"] },
            rating: 4.5,
            ratingCount: 123,
            priceLevel: "PRICE_LEVEL_MODERATE",
            websiteUri: "https://example.com/trattoria",
        })

        const second = await authed.action(api.places.details, { placeId, tier: "combined" })
        expect(fetches).toBe(1)
        expect(second).toEqual(first)
    })

    test("details refetches and stores when the cached row is stale", async () => {
        let fetches = 0
        server.use(
            http.get(combinedUrl(GOOGLE_PLACE_ID), () => {
                fetches += 1
                return HttpResponse.json(combinedPayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        await t.run(async (ctx) => {
            await ctx.db.insert("googlePlaceCache", {
                placeId,
                kind: "details-combined",
                payload: {
                    openingHours: { openState: "unknown", periods: [], weekdayText: [] },
                },
                fetchedAt: 0,
            })
        })

        const result = await authed.action(api.places.details, { placeId, tier: "combined" })
        expect(fetches).toBe(1)
        expect(result).toMatchObject({ businessStatus: "OPERATIONAL", rating: 4.5 })
    })

    test("atmosphere serves the cached row without a Google fetch", async () => {
        let fetches = 0
        server.use(
            http.get(atmosphereUrl(GOOGLE_PLACE_ID), () => {
                fetches += 1
                return HttpResponse.json(atmospherePayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        const first = await authed.action(api.places.atmosphere, { placeId })
        expect(fetches).toBe(1)
        expect(first).toEqual({
            servesVegetarianFood: true,
            goodForGroups: true,
            reservable: false,
            editorialSummary: { text: "A cozy neighborhood spot.", languageCode: "en" },
        })

        const second = await authed.action(api.places.atmosphere, { placeId })
        expect(fetches).toBe(1)
        expect(second).toEqual(first)
    })

    test("unauthenticated callers cannot read cached details", async () => {
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)

        await expect(t.action(api.places.details, { placeId, tier: "combined" })).rejects.toThrow("Unauthorized")
    })
})
