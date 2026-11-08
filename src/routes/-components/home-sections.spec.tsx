import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { TasteCards, TasteCardsSkeleton, timeAgo, type LandingStats } from "./home-sections"

const stats: LandingStats = {
    totalRestaurants: 3,
    totalWants: 5,
    topCuisines: [{ cuisine: "Italian", count: 2 }],
    recentAdds: [
        {
            name: "Casa Rosa",
            cuisine: "Italian",
            location: "Luxembourg",
            saverName: "Mia Keller",
            imageUrl: "https://example.com/casa-rosa.jpg",
            createdAt: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
            name: "Forno",
            cuisine: "Pizza",
            location: "Luxembourg",
            saverName: "Sam",
            imageUrl: undefined,
            createdAt: Date.now() - 5 * 60 * 60 * 1000,
        },
    ],
}

describe("TasteCards", () => {
    test("reserves the same landmark while stats load", () => {
        const { unmount } = render(<TasteCardsSkeleton />)
        const skeleton = screen.getByRole("region", { name: "Sample community activity" })
        expect(skeleton.getAttribute("aria-busy")).toBe("true")
        unmount()

        render(<TasteCards tastes={stats.recentAdds} />)
        expect(screen.getByRole("region", { name: "Sample community activity" })).toBeInTheDocument()
    })

    test("renders saver first names, actions, and restaurant details", () => {
        render(<TasteCards tastes={stats.recentAdds} />)

        expect(screen.getByText("Mia")).toBeInTheDocument()
        expect(screen.getByText("shared a photo")).toBeInTheDocument()
        expect(screen.getByText("Casa Rosa")).toBeInTheDocument()
        expect(screen.getByText("Italian · Luxembourg")).toBeInTheDocument()
        expect(screen.getByText("Sam")).toBeInTheDocument()
        expect(screen.getByText("saved a spot")).toBeInTheDocument()
    })

    test("shows photos only when an image url exists", () => {
        render(<TasteCards tastes={stats.recentAdds} />)

        expect(screen.getByAltText("Casa Rosa")).toBeInTheDocument()
        expect(screen.queryByAltText("Forno")).not.toBeInTheDocument()
    })

    test("renders nothing without recent adds", () => {
        render(<TasteCards tastes={[]} />)

        expect(screen.queryByRole("region", { name: "Sample community activity" })).not.toBeInTheDocument()
    })
})

describe("timeAgo", () => {
    test("names minutes, hours, and days", () => {
        const now = new Date("2026-11-08T12:00:00Z").getTime()
        expect(timeAgo(now - 30 * 1000, now)).toBe("just now")
        expect(timeAgo(now - 5 * 60 * 1000, now)).toBe("5m ago")
        expect(timeAgo(now - 2 * 60 * 60 * 1000, now)).toBe("2h ago")
        expect(timeAgo(now - 3 * 24 * 60 * 60 * 1000, now)).toBe("3d ago")
    })
})
