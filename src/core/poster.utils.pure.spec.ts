import { describe, expect, test } from "vitest"

import { buildPosterFileName, supportsHtmlInCanvas } from "./poster.utils"

describe("supportsHtmlInCanvas", () => {
    test("reports unsupported without a DOM", () => {
        expect(supportsHtmlInCanvas()).toBe(false)
    })
})

describe("buildPosterFileName", () => {
    test("slugifies the restaurant name", () => {
        expect(buildPosterFileName("Mama's Dumpling House!")).toBe("mama-s-dumpling-house-poster.png")
    })

    test("falls back for blank names", () => {
        expect(buildPosterFileName("!!!")).toBe("bite-poster.png")
    })
})
