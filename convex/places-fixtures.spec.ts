import { convexTest } from "convex-test"
/// <reference types="vite/client" />
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { server } from "../src/vitest.msw.setup"
import { api } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

const GOOGLE_PLACE_ID = "ChIJfixture"
const AUTH_USER_ID = "fixture-user-1"

const savedApiKey = process.env.GOOGLE_MAPS_API_KEY
const savedFixtures = process.env.GOOGLE_PLACES_FIXTURES

function googleUrl(placeId: string, fields: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}`
}

async function seedPlace(t: ReturnType<typeof convexTest>): Promise<Id<"places">> {
    return t.run(async (ctx) => {
        const owner = await ctx.db.insert("profiles", {
            authUserId: AUTH_USER_ID,
            name: "Fixture Owner",
            email: "fixture-owner@example.com",
        })
        return ctx.db.insert("places", {
            ownerId: owner,
            name: "Fixture Place",
            address: { label: "Luxembourg City", google: { placeId: GOOGLE_PLACE_ID } },
        })
    })
}

describe("google places fixtures", () => {
    beforeEach(() => {
        delete process.env.GOOGLE_MAPS_API_KEY
        process.env.GOOGLE_PLACES_FIXTURES = "true"
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

    test("fixture mode answers without an api key and without a Google fetch", async () => {
        let fetches = 0
        const count = () => {
            fetches += 1
            return HttpResponse.json({})
        }
        server.use(
            http.get(googleUrl(GOOGLE_PLACE_ID, "location,viewport"), count),
            http.get(googleUrl(GOOGLE_PLACE_ID, "currentOpeningHours"), count),
            http.get("*", count),
        )
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")
        const placeId = await seedPlace(t)
        const authed = t.withIdentity({ subject: AUTH_USER_ID })

        const pro = await authed.action(api.places.details, { placeId, tier: "pro" })
        expect(pro).toEqual({
            displayName: "Fixture Bistro",
            primaryType: "french_restaurant",
            googleMapsUri: "https://maps.google.com/?cid=fixture",
            businessStatus: "OPERATIONAL",
            utcOffsetMinutes: 60,
        })

        const enterprise = await authed.action(api.places.details, { placeId, tier: "enterprise" })
        expect(enterprise).toEqual({
            openingHours: {
                openState: "open",
                periods: [{ day: 1, openTime: "09:00", closeTime: "22:00" }],
                weekdayText: ["Monday: 9:00 AM – 10:00 PM"],
            },
            rating: 4.2,
            ratingCount: 42,
            priceLevel: "PRICE_LEVEL_MODERATE",
            websiteUri: "https://example.com/fixture-bistro",
        })

        const location = await authed.action(api.places.location, { placeId })
        expect(location).toEqual({
            lat: 49.61,
            lng: 6.13,
            viewport: {
                low: { lat: 49.6, lng: 6.12 },
                high: { lat: 49.62, lng: 6.14 },
            },
        })

        expect(fetches).toBe(0)
    })
})
