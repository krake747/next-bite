import { describe, expect, test } from "vitest"

import { suggestCuisine } from "./cuisine-suggestion"

describe("suggestCuisine", () => {
    test("maps common restaurant types to cuisine labels", () => {
        expect(suggestCuisine("italian_restaurant")).toBe("Italian")
        expect(suggestCuisine("sushi_restaurant")).toBe("Sushi")
        expect(suggestCuisine("ramen_restaurant")).toBe("Ramen")
        expect(suggestCuisine("hamburger_restaurant")).toBe("Burgers")
        expect(suggestCuisine("coffee_shop")).toBe("Coffee")
        expect(suggestCuisine("wine_bar")).toBe("Wine Bar")
    })

    test("returns undefined for missing, empty, and non-food types", () => {
        expect(suggestCuisine(undefined)).toBeUndefined()
        expect(suggestCuisine("")).toBeUndefined()
        expect(suggestCuisine("grocery_store")).toBeUndefined()
        expect(suggestCuisine("meal_takeaway")).toBeUndefined()
    })
})
