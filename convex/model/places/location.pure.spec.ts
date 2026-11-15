import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { server } from "../../../src/vitest.msw.setup"
import { fetchPlaceLocation } from "./location"

const PLACE_PATH = "https://places.googleapis.com/v1/places/ChIJtest"
const LOCATION_FIELDS = "location,viewport"

function fieldsOf(request: Request): string | null {
    return new URL(request.url).searchParams.get("fields")
}

function serveLocation(body: unknown, status = 200, onRequest?: (request: Request) => void): void {
    server.use(
        http.get(PLACE_PATH, ({ request }) => {
            onRequest?.(request)
            return new HttpResponse(JSON.stringify(body), { status })
        }),
    )
}

describe("fetchPlaceLocation", () => {
    test("returns null without a place id or api key", async () => {
        await expect(fetchPlaceLocation("", "test-key")).resolves.toBeNull()
        await expect(fetchPlaceLocation("ChIJtest", undefined)).resolves.toBeNull()
    })

    test("returns fresh coordinates from the Essentials location field", async () => {
        let fields: string | null = null
        serveLocation({ location: { latitude: 49.6, longitude: 6.13 } }, 200, (request) => {
            fields = fieldsOf(request)
        })

        await expect(fetchPlaceLocation("ChIJtest", "test-key")).resolves.toEqual({
            lat: 49.6,
            lng: 6.13,
        })
        expect(fields).toBe(LOCATION_FIELDS)
    })

    test("includes the viewport when the provider returns one", async () => {
        serveLocation({
            location: { latitude: 49.6, longitude: 6.13 },
            viewport: {
                low: { latitude: 49.5, longitude: 6.0 },
                high: { latitude: 49.7, longitude: 6.2 },
            },
        })

        await expect(fetchPlaceLocation("ChIJtest", "test-key")).resolves.toEqual({
            lat: 49.6,
            lng: 6.13,
            viewport: {
                low: { lat: 49.5, lng: 6.0 },
                high: { lat: 49.7, lng: 6.2 },
            },
        })
    })

    test("omits a partial viewport", async () => {
        serveLocation({
            location: { latitude: 49.6, longitude: 6.13 },
            viewport: { low: { latitude: 49.5, longitude: 6.0 } },
        })

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
