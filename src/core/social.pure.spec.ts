import { describe, expect, test } from "vitest"

import { type Id } from "@convex/_generated/dataModel"

import { feedTextFor, orderFeedByRecency, summarizeSocial, withoutTempIds, type SocialSnapshot } from "./social"

const snapshot: SocialSnapshot = {
    interests: [
        { restaurantId: "aaa", userId: "u1", displayName: "Alex", status: "want" },
        { restaurantId: "aaa", userId: "u2", displayName: "Priya", status: "been" },
    ],
}

describe("withoutTempIds", () => {
    test("drops optimistic ids while keeping real ones", () => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant ids
        const real = "r1" as unknown as Id<"restaurants">
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only temp id
        const temp = "optimistic-abc" as unknown as Id<"restaurants">

        expect(withoutTempIds([temp, real])).toEqual([real])
        expect(withoutTempIds([])).toEqual([])
    })
})

describe("summarizeSocial", () => {
    test("aggregates counts and personal state", () => {
        const summary = summarizeSocial("aaa", snapshot, { kind: "signed-in", id: "u1" })
        expect(summary.wantCount).toBe(1)
        expect(summary.beenCount).toBe(1)
        expect(summary.wanted).toBe(true)
        expect(summary.interestedNames).toEqual(["Alex", "Priya"])
    })

    test("isolates restaurants and treats guests as non-participants", () => {
        expect(summarizeSocial("bbb", snapshot, { kind: "signed-out" })).toEqual({
            wantCount: 0,
            beenCount: 0,
            wanted: false,
            interestedNames: [],
        })
    })

    test("marks others as non-participants", () => {
        const summary = summarizeSocial("aaa", snapshot, { kind: "signed-in", id: "u9" })
        expect(summary.wanted).toBe(false)
        expect(summary.wantCount).toBe(1)
    })
})

describe("orderFeedByRecency", () => {
    test("sorts newest first without mutating the input", () => {
        const input = [{ _creationTime: 1 }, { _creationTime: 3 }, { _creationTime: 2 }]
        const ordered = orderFeedByRecency(input)
        expect(ordered.map((item) => item._creationTime)).toEqual([3, 2, 1])
        expect(input.map((item) => item._creationTime)).toEqual([1, 3, 2])
    })
})

describe("feedTextFor", () => {
    test("prefers notes and falls back to an added line", () => {
        expect(feedTextFor("Verde", "Great pasta.")).toBe("Great pasta.")
        expect(feedTextFor("Verde", "  ")).toBe("Added Verde.")
        expect(feedTextFor("Verde", undefined)).toBe("Added Verde.")
    })
})
