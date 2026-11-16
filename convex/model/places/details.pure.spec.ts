import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import {
    ENTERPRISE_FIELD_MASK,
    fetchPlaceDetails,
    isMeaningfulResult,
    PLACE_FIELD_MASKS,
    PRO_FIELD_MASK,
} from "./details"

function maskPath(placeId: string): string {
    return `https://places.googleapis.com/v1/places/${placeId}`
}

function fieldsOf(request: Request): string | null {
    return new URL(request.url).searchParams.get("fields")
}

describe("place details field masks", () => {
    test("granular masks stay disjoint across SKUs", () => {
        expect(PLACE_FIELD_MASKS.pro).toEqual([...PRO_FIELD_MASK])
        expect(PLACE_FIELD_MASKS.enterprise).toEqual([...ENTERPRISE_FIELD_MASK])
        const all = [...PLACE_FIELD_MASKS.pro, ...PLACE_FIELD_MASKS.enterprise]
        expect(new Set(all).size).toBe(all.length)
    })
})

describe("fetchPlaceDetails granular", () => {
    test("returns tier fallbacks without a place id or api key", async () => {
        await expect(fetchPlaceDetails("", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
        await expect(fetchPlaceDetails("ChIJmissing-key", undefined, "pro")).resolves.toEqual({})
    })

    test("returns pro fields only", async () => {
        let fields: string | null = null
        server.use(
            http.get(maskPath("ChIJpro"), ({ request }) => {
                fields = fieldsOf(request)
                return HttpResponse.json({ businessStatus: "OPERATIONAL", displayName: { text: "Verde" } })
            }),
        )

        await expect(fetchPlaceDetails("ChIJpro", "test-key", "pro")).resolves.toEqual({
            businessStatus: "OPERATIONAL",
            displayName: "Verde",
        })
        expect(fields).toBe([...PRO_FIELD_MASK].join(","))
    })

    test("returns enterprise fields only", async () => {
        let fields: string | null = null
        server.use(
            http.get(maskPath("ChIJent"), ({ request }) => {
                fields = fieldsOf(request)
                return HttpResponse.json({
                    currentOpeningHours: { openNow: true, weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"] },
                    rating: 4.5,
                    userRatingCount: 123,
                    priceLevel: "PRICE_LEVEL_MODERATE",
                    websiteUri: "https://example.com/trattoria",
                })
            }),
        )

        await expect(fetchPlaceDetails("ChIJent", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "open", periods: [], weekdayText: ["Monday: 9:00 AM – 5:00 PM"] },
            rating: 4.5,
            ratingCount: 123,
            priceLevel: "PRICE_LEVEL_MODERATE",
            websiteUri: "https://example.com/trattoria",
        })
        expect(fields).toBe([...ENTERPRISE_FIELD_MASK].join(","))
    })

    test("fetches fresh with no persistent cache", async () => {
        let calls = 0
        server.use(
            http.get(maskPath("ChIJnocache"), () => {
                calls += 1
                return HttpResponse.json({ rating: 4.0 })
            }),
        )

        await fetchPlaceDetails("ChIJnocache", "test-key", "enterprise")
        await fetchPlaceDetails("ChIJnocache", "test-key", "enterprise")
        expect(calls).toBe(2)
    })

    test("coalesces in-flight requests per tier", async () => {
        let calls = 0
        server.use(
            http.get(maskPath("ChIJcoalesce"), async () => {
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
        server.use(http.get(maskPath("ChIJreject"), () => new HttpResponse(null, { status: 500 })))

        await expect(fetchPlaceDetails("ChIJreject", "test-key", "enterprise")).resolves.toEqual({
            openingHours: { openState: "unknown", periods: [], weekdayText: [] },
        })
    })

    test("detects empty results so callers skip caching", () => {
        expect(isMeaningfulResult({})).toBe(false)
        expect(
            isMeaningfulResult({
                openingHours: { openState: "unknown", periods: [], weekdayText: [] },
            }),
        ).toBe(false)
        expect(isMeaningfulResult({ businessStatus: "OPERATIONAL" })).toBe(true)
    })
})
