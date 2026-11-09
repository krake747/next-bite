import { describe, expect, it } from "vitest"

import { buildPosterFileName, paintPosterElement, supportsHtmlInCanvas } from "./poster.utils"

describe("supportsHtmlInCanvas", () => {
    it("reports unsupported outside a capable browser", () => {
        expect(supportsHtmlInCanvas()).toBe(false)
    })
})

describe("paintPosterElement", () => {
    it("refuses a missing context", () => {
        expect(paintPosterElement(null, document.createElement("div"))).toBe(false)
    })

    it("refuses an incapable context", () => {
        const canvas = document.createElement("canvas")
        expect(paintPosterElement(canvas.getContext("2d"), document.createElement("div"))).toBe(false)
    })
})

describe("buildPosterFileName", () => {
    it("slugifies the restaurant name", () => {
        expect(buildPosterFileName("Mama's Dumpling House!")).toBe("mama-s-dumpling-house-poster.png")
    })

    it("falls back for blank names", () => {
        expect(buildPosterFileName("!!!")).toBe("bite-poster.png")
    })
})
