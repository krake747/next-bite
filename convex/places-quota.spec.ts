import { convexTest } from "convex-test"
/// <reference types="vite/client" />
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"

import { server } from "../src/vitest.msw.setup"
import { api } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

const AUTH_USER_ID = "quota-user-1"

// Enterprise bucket capacity in convex/rateLimits.ts. The loop below burns
// the whole bucket across distinct restaurants so every call fetches, then
// the final call proves the fail-open path. Distinct restaurants dodge the
// Google cache, which never consumes quota on a hit.
const ENTERPRISE_CAPACITY = 60

const savedApiKey = process.env.GOOGLE_MAPS_API_KEY
const savedFixtures = process.env.GOOGLE_PLACES_FIXTURES

function enterprisePayload() {
    return {
        currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM - 5:00 PM"] },
        rating: 4.2,
        userRatingCount: 42,
        priceLevel: "PRICE_LEVEL_MODERATE",
        websiteUri: "https://example.com/fixture-bistro",
    }
}

async function seedOwner(t: ReturnType<typeof convexTest>): Promise<Id<"profiles">> {
    return t.run(async (ctx) => {
        return ctx.db.insert("profiles", {
            authUserId: AUTH_USER_ID,
            name: "Quota Owner",
            email: "quota-owner@example.com",
        })
    })
}

async function seedPlace(
    t: ReturnType<typeof convexTest>,
    ownerId: Id<"profiles">,
    googlePlaceId: string,
): Promise<Id<"places">> {
    return t.run(async (ctx) => {
        return ctx.db.insert("places", {
            ownerId,
            name: "Quota Place",
            address: { label: "Luxembourg City", google: { placeId: googlePlaceId } },
        })
    })
}

describe("google places quota", () => {
    beforeEach(() => {
        process.env.GOOGLE_MAPS_API_KEY = "test-key"
        delete process.env.GOOGLE_PLACES_FIXTURES
    })

    afterEach(() => {
        if (savedApiKey === undefined) {
            delete process.env.GOOGLE_MAPS_API_KEY
        } else {
            process.env.GOOGLE_MAPS_API_KEY = savedApiKey
        }
        if (savedFixtures === undefined) {
            delete process.env.GOOGLE_PLACES_FIXTURES
        } else {
            process.env.GOOGLE_PLACES_FIXTURES = savedFixtures
        }
    })

    test("enterprise calls fail open without a Google fetch once the bucket is empty", async () => {
        let fetches = 0
        server.use(
            http.get("https://places.googleapis.com/v1/places/:placeId", () => {
                fetches += 1
                return HttpResponse.json(enterprisePayload())
            }),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        registerRateLimiter(t, "rateLimiter")
        const ownerId = await seedOwner(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        for (let i = 0; i < ENTERPRISE_CAPACITY; i += 1) {
            const placeId = await seedPlace(t, ownerId, `ChIJquota${i}`)
            await authed.action(api.places.details, { placeId, tier: "enterprise" })
        }
        expect(fetches).toBe(ENTERPRISE_CAPACITY)

        const overflowPlaceId = await seedPlace(t, ownerId, "ChIJquotaOverflow")
        const throttled = await authed.action(api.places.details, { placeId: overflowPlaceId, tier: "enterprise" })
        expect(fetches).toBe(ENTERPRISE_CAPACITY)
        expect(throttled).toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })
})
