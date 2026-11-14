import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import { COMBINED_FIELD_MASK, ENTERPRISE_FIELD_MASK, fetchPlaceDetails, PLACE_FIELD_MASKS } from "./details"

function combinedUrl(placeId: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}?fields=${COMBINED_FIELD_MASK.join(",")}`
}

describe("place details field masks", () => {
    test("combined and atmosphere masks follow the spike tiers", () => {
        expect(PLACE_FIELD_MASKS.combined).toEqual(
            expect.arrayContaining([
                "displayName",
                "businessStatus",
                "currentOpeningHours",
                "priceLevel",
                "rating",
                "userRatingCount",
                "websiteUri",
            ]),
        )
        expect(PLACE_FIELD_MASKS.atmosphere).toEqual(
            expect.arrayContaining([...ENTERPRISE_FIELD_MASK, "editorialSummary", "servesVegetarianFood"]),
        )
    })
})

describe("fetchPlaceDetails combined", () => {
    test("returns fallback without a place id or api key", async () => {
        await expect(fetchPlaceDetails("", "test-key", "combined")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
        await expect(fetchPlaceDetails("ChIJmissing-key", undefined, "combined")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })

    test("returns pro and enterprise fields from one Details call", async () => {
        server.use(
            http.get(combinedUrl("ChIJfresh"), () => {
                return HttpResponse.json({
                    businessStatus: "OPERATIONAL",
                    currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"] },
                    rating: 4.5,
                    userRatingCount: 123,
                    priceLevel: "PRICE_LEVEL_MODERATE",
                    websiteUri: "https://example.com/trattoria",
                })
            }),
        )

        await expect(fetchPlaceDetails("ChIJfresh", "test-key", "combined")).resolves.toEqual({
            businessStatus: "OPERATIONAL",
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
            http.get(combinedUrl("ChIJnocache"), () => {
                calls += 1
                return HttpResponse.json({ rating: 4.0 })
            }),
        )

        await fetchPlaceDetails("ChIJnocache", "test-key", "combined")
        await fetchPlaceDetails("ChIJnocache", "test-key", "combined")
        expect(calls).toBe(2)
    })

    test("coalesces in-flight requests", async () => {
        let calls = 0
        server.use(
            http.get(combinedUrl("ChIJcoalesce"), async () => {
                calls += 1
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 20)
                })
                return HttpResponse.json({ rating: 4.7 })
            }),
        )

        const [first, second] = await Promise.all([
            fetchPlaceDetails("ChIJcoalesce", "test-key", "combined"),
            fetchPlaceDetails("ChIJcoalesce", "test-key", "combined"),
        ])
        expect(calls).toBe(1)
        expect(first).toEqual(second)
    })

    test("returns fallback when the provider rejects", async () => {
        server.use(http.get(combinedUrl("ChIJreject"), () => new HttpResponse(null, { status: 500 })))

        await expect(fetchPlaceDetails("ChIJreject", "test-key", "combined")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })
})
