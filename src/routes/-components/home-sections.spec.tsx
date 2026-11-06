import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CommunityStats, CommunityStatsSkeleton, type LandingStats } from "./home-sections"

const stats: LandingStats = {
    totalRestaurants: 3,
    totalWants: 5,
    topCuisines: [{ cuisine: "Italian", count: 2 }],
    recentAdds: [],
}

describe("CommunityStats", () => {
    it("reserves the same landmark while stats load", () => {
        const { unmount } = render(<CommunityStatsSkeleton />)
        const skeleton = screen.getByRole("region", { name: "Community activity" })
        expect(skeleton.getAttribute("aria-busy")).toBe("true")
        unmount()

        render(<CommunityStats stats={stats} />)
        expect(screen.getByRole("region", { name: "Community activity" })).toBeInTheDocument()
    })
})
