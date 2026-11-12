import { describe, expect, test } from "vitest"

import { assertRealId, isTempId, TEMP_ID_PREFIX } from "./temp.ids"

describe("temp ids", () => {
    test("detects optimistic ids by prefix", () => {
        expect(isTempId(`${TEMP_ID_PREFIX}abc`)).toBe(true)
        expect(isTempId("j57abc")).toBe(false)
        expect(isTempId("")).toBe(false)
    })

    test("rejects temp ids for server writes", () => {
        expect(() => {
            assertRealId(`${TEMP_ID_PREFIX}abc`)
        }).toThrow("still syncing")
        expect(() => {
            assertRealId("j57abc")
        }).not.toThrow()
    })
})
