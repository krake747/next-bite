import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import { ENTERPRISE_FIELD_MASK, fetchPlaceDetails, PLACE_FIELD_MASKS } from "./details"

function enterpriseUrl(placeId: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${ENTERPRISE_FIELD_MASK.join(",")}`
}

describe("place details field masks", () => {
    test("pro, enterprise, and atmosphere masks follow the spike tiers", () => {
        expect(PLACE_FIELD_MASKS.pro).toContain("displayName")
        expect(PLACE_FIELD_MASKS.enterprise).toEqual(
            expect.arrayContaining(["currentOpeningHours", "priceLevel", "rating", "userRatingCount", "websiteUri"]),
        )
        expect(PLACE_FIELD_MASKS.atmosphere).toEqual(
            expect.arrayContaining([...ENTERPRISE_FIELD_MASK, "editorialSummary", "servesVegetarianFood"]),
        )
    })
})

describe("fetchPlaceDetails enterprise", () => {
    test("returns fallback without a place id or api key", async () => {
        await expect(fetchPlaceDetails("", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
        await expect(fetchPlaceDetails("ChIJmissing-key", undefined, "enterprise")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })

    test("returns fresh enterprise fields from one Details call", async () => {
        server.use(
            http.get(enterpriseUrl("ChIJfresh"), () => {
                return HttpResponse.json({
                    currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"] },
                    rating: 4.5,
                    userRatingCount: 123,
                    priceLevel: "PRICE_LEVEL_MODERATE",
                    websiteUri: "https://example.com/trattoria",
                })
            }),
        )

        await expect(fetchPlaceDetails("ChIJfresh", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "open", periods: [], weekdayText: ["Monday: 9:00 AM – 5:00 PM"] },
            rating: 4.5,
            ratingCount: 123,
            priceLevel: "PRICE_LEVEL_MODERATE",
            websiteUri: "https://example.com/trattoria",
        })
    })

    test("fetches fresh with no persistent cache", async () => {
        let calls = 0
        server.use(
            http.get(enterpriseUrl("ChIJnocache"), () => {
                calls += 1
                return HttpResponse.json({ rating: 4.0 })
            }),
        )

        await fetchPlaceDetails("ChIJnocache", "test-key", "enterprise")
        await fetchPlaceDetails("ChIJnocache", "test-key", "enterprise")
        expect(calls).toBe(2)
    })

    test("coalesces in-flight requests", async () => {
        let calls = 0
        server.use(
            http.get(enterpriseUrl("ChIJcoalesce"), async () => {
                calls += 1
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 20)
                })
                return HttpResponse.json({ rating: 4.7 })
            }),
        )

        const [first, second] = await Promise.all([
            fetchPlaceDetails("ChIJcoalesce", "test-key", "enterprise"),
            fetchPlaceDetails("ChIJcoalesce", "test-key", "enterprise"),
        ])
        expect(calls).toBe(1)
        expect(first).toEqual(second)
    })

    test("returns fallback when the provider rejects", async () => {
        server.use(http.get(enterpriseUrl("ChIJreject"), () => new HttpResponse(null, { status: 500 })))

        await expect(fetchPlaceDetails("ChIJreject", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })
})
