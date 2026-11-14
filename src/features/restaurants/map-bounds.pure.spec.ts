import { describe, expect, test } from "vitest"

import { boundsForViewport } from "./map-bounds"

const viewport = {
    low: { lat: 49.5, lng: 6.0 },
    high: { lat: 49.7, lng: 6.2 },
}

describe("boundsForViewport", () => {
    test("maps low and high corners to bounds", () => {
        expect(boundsForViewport(viewport)).toEqual({ south: 49.5, west: 6.0, north: 49.7, east: 6.2 })
    })

    test("returns undefined without a viewport", () => {
        expect(boundsForViewport(undefined)).toBeUndefined()
    })
})
