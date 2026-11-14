import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import { ATMOSPHERE_MASK, fetchPlaceAtmosphere } from "./atmosphere"

const PLACE_URL = `https://places.googleapis.com/v1/places/ChIJtest?fields=${ATMOSPHERE_MASK}`

function serveAtmosphere(body: unknown, status = 200): void {
    server.use(http.get(PLACE_URL, () => new HttpResponse(JSON.stringify(body), { status })))
}

describe("fetchPlaceAtmosphere", () => {
    test("returns empty atmosphere without a place id or api key", async () => {
        await expect(fetchPlaceAtmosphere("", "test-key")).resolves.toEqual({})
        await expect(fetchPlaceAtmosphere("ChIJtest", undefined)).resolves.toEqual({})
    })

    test("uses the Atmosphere field mask", () => {
        expect(ATMOSPHERE_MASK).not.toContain("photos")
        expect(ATMOSPHERE_MASK).toContain("servesVegetarianFood")
        expect(ATMOSPHERE_MASK).toContain("goodForGroups")
        expect(ATMOSPHERE_MASK).toContain("reservable")
    })

    test("maps summaries and flags", async () => {
        serveAtmosphere({
            editorialSummary: { text: "Cozy terrace spot", languageCode: "en" },
            reviewSummary: {
                text: { text: "Guests love the terrace" },
                disclosureText: { text: "Summarized with Gemini" },
                flagContentUri: "https://maps.google.com/report",
                reviewsUri: "https://maps.google.com/reviews",
            },
            servesVegetarianFood: true,
            goodForGroups: false,
            reservable: true,
        })

        await expect(fetchPlaceAtmosphere("ChIJtest", "test-key")).resolves.toEqual({
            editorialSummary: { text: "Cozy terrace spot", languageCode: "en" },
            reviewSummary: {
                text: "Guests love the terrace",
                disclosureText: "Summarized with Gemini",
                flagContentUri: "https://maps.google.com/report",
                reviewsUri: "https://maps.google.com/reviews",
            },
            servesVegetarianFood: true,
            goodForGroups: false,
            reservable: true,
        })
    })

    test("returns empty atmosphere when the provider rejects", async () => {
        serveAtmosphere({}, 500)

        await expect(fetchPlaceAtmosphere("ChIJtest", "test-key")).resolves.toEqual({})
    })
})
