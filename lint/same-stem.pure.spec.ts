import { describe, expect, test } from "vitest"

import {
    compareCollisionKeys,
    compareStrings,
    formatCollision,
    hasMultipleExtensions,
    recordFile,
} from "./same-stem.js"

describe("recordFile", () => {
    test("groups source stems by directory and extension", () => {
        const seen: Map<string, Set<string>> = new Map()
        recordFile(seen, "src/ui", "button.tsx")
        recordFile(seen, "src/ui", "button.ts")
        recordFile(seen, "src/ui", "card.tsx")
        expect(seen.get("src/ui/button")).toEqual(new Set([".tsx", ".ts"]))
        expect(seen.get("src/ui/card")).toEqual(new Set([".tsx"]))
    })

    test("ignores generated and non-source files", () => {
        const seen: Map<string, Set<string>> = new Map()
        recordFile(seen, "src", "routeTree.gen.ts")
        recordFile(seen, "src", "notes.md")
        recordFile(seen, "src", "font.woff2")
        expect(seen.size).toBe(1)
        expect(seen.get("src/routeTree.gen")).toEqual(new Set([".ts"]))
    })
})

describe("hasMultipleExtensions", () => {
    test("flags stems with two source extensions", () => {
        expect(hasMultipleExtensions(["src/a", new Set([".ts", ".tsx"])])).toBe(true)
        expect(hasMultipleExtensions(["src/a", new Set([".ts"])])).toBe(false)
    })
})

describe("compareCollisionKeys", () => {
    test("orders by path", () => {
        expect(compareCollisionKeys(["b", new Set()], ["a", new Set()])).toBe(1)
        expect(compareCollisionKeys(["a", new Set()], ["b", new Set()])).toBe(-1)
    })
})

describe("compareStrings", () => {
    test("compares lexicographically with equality", () => {
        expect(compareStrings("a", "b")).toBe(-1)
        expect(compareStrings("b", "a")).toBe(1)
        expect(compareStrings("a", "a")).toBe(0)
    })
})

describe("formatCollision", () => {
    test("renders the stem with sorted extensions", () => {
        expect(formatCollision(["src/a", new Set([".tsx", ".ts"])])).toBe("same-stem collision: src/a{.ts,.tsx}")
    })
})
