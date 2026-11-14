import { describe, expect, test } from "vitest"

import { formatPriceLevel, formatRating, formatRatingCount, hasEnterpriseContent } from "./place-details-utils"

describe("place enterprise details formatting", () => {
    test("price level maps Google enums to labels", () => {
        expect(formatPriceLevel("PRICE_LEVEL_INEXPENSIVE")).toBe("$")
        expect(formatPriceLevel("PRICE_LEVEL_MODERATE")).toBe("$$")
        expect(formatPriceLevel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$")
        expect(formatPriceLevel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$")
        expect(formatPriceLevel("PRICE_LEVEL_FREE")).toBe("Free")
    })

    test("unknown price levels and missing values stay empty", () => {
        expect(formatPriceLevel(undefined)).toBeUndefined()
        expect(formatPriceLevel("SOMETHING_ELSE")).toBeUndefined()
    })

    test("rating formats to one decimal and count keeps parentheses", () => {
        expect(formatRating(4.5)).toBe("4.5")
        expect(formatRating(undefined)).toBeUndefined()
        expect(formatRatingCount(123)).toBe("(123)")
        expect(formatRatingCount(undefined)).toBeUndefined()
    })

    test("hasEnterpriseContent is false while loading or when empty", () => {
        expect(hasEnterpriseContent(undefined)).toBe(false)
        expect(hasEnterpriseContent({})).toBe(false)
        expect(hasEnterpriseContent({ websiteUri: "" })).toBe(false)
        expect(hasEnterpriseContent({ rating: 4.5 })).toBe(true)
        expect(hasEnterpriseContent({ websiteUri: "https://example.com" })).toBe(true)
    })
})
