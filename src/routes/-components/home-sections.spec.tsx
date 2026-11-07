import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { CommunityStats, CommunityStatsSkeleton, type LandingStats } from "./home-sections"

const stats: LandingStats = {
    totalRestaurants: 3,
    totalWants: 5,
    topCuisines: [{ cuisine: "Italian", count: 2 }],
    recentAdds: [],
}

describe("CommunityStats", () => {
    test("reserves the same landmark while stats load", () => {
        const { unmount } = render(<CommunityStatsSkeleton />)
        const skeleton = screen.getByRole("region", { name: "Community activity" })
        expect(skeleton.getAttribute("aria-busy")).toBe("true")
        unmount()

        render(<CommunityStats stats={stats} />)
        expect(screen.getByRole("region", { name: "Community activity" })).toBeInTheDocument()
    })

    test("renders the aggregate counts", () => {
        render(<CommunityStats stats={stats} />)

        expect(screen.getByText("3")).toBeInTheDocument()
        expect(screen.getByText("restaurants shared")).toBeInTheDocument()
        expect(screen.getByText("5")).toBeInTheDocument()
        expect(screen.getByText("wants saved")).toBeInTheDocument()
        expect(screen.getByText("Italian")).toBeInTheDocument()
    })

    test("names recent adds when present", () => {
        render(
            <CommunityStats
                stats={{ ...stats, recentAdds: [{ name: "Sushi Bar", cuisine: "Japanese", createdAt: 2 }] }}
            />,
        )

        expect(screen.getByText(/Fresh on the list:/)).toBeInTheDocument()
        expect(screen.getByText(/Sushi Bar \(Japanese\)/)).toBeInTheDocument()
    })

    test("omits the recent line with no adds", () => {
        render(<CommunityStats stats={stats} />)

        expect(screen.queryByText(/Fresh on the list:/)).not.toBeInTheDocument()
    })
})
