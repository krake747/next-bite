import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import { fetchPlaceLocation } from "./location"

const PLACE_URL = "https://places.googleapis.com/v1/places/ChIJtest?fields=location"

function serveLocation(body: unknown, status = 200): void {
    server.use(http.get(PLACE_URL, () => new HttpResponse(JSON.stringify(body), { status })))
}

describe("fetchPlaceLocation", () => {
    test("returns null without a place id or api key", async () => {
        await expect(fetchPlaceLocation("", "test-key")).resolves.toBeNull()
        await expect(fetchPlaceLocation("ChIJtest", undefined)).resolves.toBeNull()
    })

    test("returns fresh coordinates from the Essentials location field", async () => {
        serveLocation({ location: { latitude: 49.6, longitude: 6.13 } })

        await expect(fetchPlaceLocation("ChIJtest", "test-key")).resolves.toEqual({
            lat: 49.6,
            lng: 6.13,
        })
    })

    test("returns null when the response has no location", async () => {
        serveLocation({})

        await expect(fetchPlaceLocation("ChIJtest", "test-key")).resolves.toBeNull()
    })

    test("returns null when the provider rejects", async () => {
        serveLocation({}, 500)

        await expect(fetchPlaceLocation("ChIJtest", "test-key")).resolves.toBeNull()
    })
})
