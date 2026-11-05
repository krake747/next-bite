import { describe, expect, it } from "vitest"

import { feedTextFor, orderFeedByRecency, summarizeSocial, type SocialSnapshot } from "./social"

const snapshot: SocialSnapshot = {
    interests: [
        { restaurantId: "aaa", userId: "u1", displayName: "Alex", status: "want" },
        { restaurantId: "aaa", userId: "u2", displayName: "Priya", status: "been" },
    ],
    likes: [{ restaurantId: "aaa", userId: "u1", displayName: "Alex" }],
    comments: [
        { _id: "c2", restaurantId: "aaa", userId: "u2", displayName: "Priya", text: "Second", createdAt: 5 },
        { _id: "c1", restaurantId: "aaa", userId: "u1", displayName: "Alex", text: "First", createdAt: 4 },
    ],
}

describe("summarizeSocial", () => {
    it("aggregates counts, personal state, and chronological comments", () => {
        const summary = summarizeSocial("aaa", snapshot, "u1")
        expect(summary.wantCount).toBe(1)
        expect(summary.beenCount).toBe(1)
        expect(summary.wanted).toBe(true)
        expect(summary.likeCount).toBe(1)
        expect(summary.liked).toBe(true)
        expect(summary.comments.map((comment) => comment.text)).toEqual(["First", "Second"])
        expect(summary.interestedNames).toEqual(["Alex", "Priya"])
    })

    it("isolates restaurants and treats guests as non-participants", () => {
        expect(summarizeSocial("bbb", snapshot, null)).toEqual({
            wantCount: 0,
            beenCount: 0,
            wanted: false,
            likeCount: 0,
            liked: false,
            comments: [],
            interestedNames: [],
        })
    })

    it("marks others as non-participants", () => {
        const summary = summarizeSocial("aaa", snapshot, "u9")
        expect(summary.wanted).toBe(false)
        expect(summary.liked).toBe(false)
        expect(summary.wantCount).toBe(1)
    })
})

describe("orderFeedByRecency", () => {
    it("sorts newest first without mutating the input", () => {
        const input = [{ _creationTime: 1 }, { _creationTime: 3 }, { _creationTime: 2 }]
        const ordered = orderFeedByRecency(input)
        expect(ordered.map((item) => item._creationTime)).toEqual([3, 2, 1])
        expect(input.map((item) => item._creationTime)).toEqual([1, 3, 2])
    })
})

describe("feedTextFor", () => {
    it("prefers notes and falls back to an added line", () => {
        expect(feedTextFor("Verde", "Great pasta.")).toBe("Great pasta.")
        expect(feedTextFor("Verde", "  ")).toBe("Added Verde.")
        expect(feedTextFor("Verde", undefined)).toBe("Added Verde.")
    })
})
