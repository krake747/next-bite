import { describe, expect, test } from "vitest"

import {
    formatBusinessStatus,
    formatOpenState,
    formatPriceLevel,
    formatRating,
    formatRatingCount,
    hasGoogleContent,
} from "./google-details-utils"

describe("google details formatting", () => {
    test("maps price levels to symbols", () => {
        expect(formatPriceLevel("PRICE_LEVEL_INEXPENSIVE")).toBe("$")
        expect(formatPriceLevel("PRICE_LEVEL_MODERATE")).toBe("$$")
        expect(formatPriceLevel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$")
        expect(formatPriceLevel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$")
        expect(formatPriceLevel("PRICE_LEVEL_FREE")).toBe("Free")
    })

    test("unknown price levels and missing values stay empty", () => {
        expect(formatPriceLevel(undefined)).toBeUndefined()
        expect(formatPriceLevel("PRICE_LEVEL_UNKNOWN")).toBeUndefined()
    })

    test("rating formats to one decimal and count keeps parentheses", () => {
        expect(formatRating(4.5)).toBe("4.5")
        expect(formatRating(undefined)).toBeUndefined()
        expect(formatRatingCount(123)).toBe("(123)")
        expect(formatRatingCount(undefined)).toBeUndefined()
    })

    test("labels closed statuses only", () => {
        expect(formatBusinessStatus("CLOSED_PERMANENTLY")).toBe("Permanently closed")
        expect(formatBusinessStatus("CLOSED_TEMPORARILY")).toBe("Temporarily closed")
        expect(formatBusinessStatus("OPERATIONAL")).toBeUndefined()
        expect(formatBusinessStatus(undefined)).toBeUndefined()
    })

    test("labels open states", () => {
        expect(formatOpenState("open")).toBe("Open now")
        expect(formatOpenState("closed")).toBe("Closed")
        expect(formatOpenState("unknown")).toBeUndefined()
    })

    test("hasGoogleContent is false while loading or when empty", () => {
        expect(hasGoogleContent(undefined)).toBe(false)
        expect(hasGoogleContent({})).toBe(false)
        expect(hasGoogleContent({ websiteUri: "" })).toBe(false)
        expect(hasGoogleContent({ rating: 4.5 })).toBe(true)
        expect(hasGoogleContent({ websiteUri: "https://example.com" })).toBe(true)
    })
})
