import * as v from "valibot"
import { describe, expect, test } from "vitest"

import { parseImageRecord, RestaurantSchema } from "./schemas"

const validRestaurant = {
    cuisine: "Italian",
    location: "Luxembourg City",
    name: "Trattoria Verde",
}

function failureMessages(schema: v.GenericSchema, input: unknown): string[] {
    const result = v.safeParse(schema, input)
    return result.success ? [] : result.issues.map((issue) => issue.message)
}

describe("RestaurantSchema", () => {
    test("accepts the required fields alone", () => {
        expect(v.safeParse(RestaurantSchema, validRestaurant).success).toBe(true)
    })

    test("accepts the full optional set", () => {
        const result = v.safeParse(RestaurantSchema, {
            ...validRestaurant,
            images: ["https://example.com/a.jpg"],
            lat: 49.6,
            link: "https://example.com/menu",
            lng: 6.1,
            notes: "Great terrace",
            placeId: "place-1",
        })
        expect(result.success).toBe(true)
    })

    test("rejects blank required fields with our messages", () => {
        expect(failureMessages(RestaurantSchema, { ...validRestaurant, name: "" })).toContain("Name is required")
        expect(failureMessages(RestaurantSchema, { ...validRestaurant, cuisine: "" })).toContain("Cuisine is required")
        expect(failureMessages(RestaurantSchema, { ...validRestaurant, location: "" })).toContain(
            "Location is required",
        )
    })

    test("rejects mistyped optionals", () => {
        expect(v.safeParse(RestaurantSchema, { ...validRestaurant, lat: "49.6" }).success).toBe(false)
        expect(v.safeParse(RestaurantSchema, { ...validRestaurant, images: "https://example.com/a.jpg" }).success).toBe(
            false,
        )
    })
})

function parsesRecord(input: unknown): boolean {
    try {
        parseImageRecord(input)
        return true
    } catch {
        return false
    }
}

describe("parseImageRecord", () => {
    test("accepts a staged upload record", () => {
        expect(parseImageRecord({ storageId: "s1", url: "https://example.com/a.jpg", ownerId: "ben" })).toMatchObject({
            storageId: "s1",
            url: "https://example.com/a.jpg",
            ownerId: "ben",
        })
    })

    test("rejects an empty url or storage id", () => {
        expect(parsesRecord({ storageId: "s1", url: "" })).toBe(false)
        expect(parsesRecord({ storageId: "", url: "https://example.com/a.jpg" })).toBe(false)
        expect(parsesRecord({ storageId: 42, url: "https://example.com/a.jpg" })).toBe(false)
    })
})
