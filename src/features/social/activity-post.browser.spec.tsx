import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { ActivityPost } from "./activity-post"

describe("ActivityPost", () => {
    test("reads like a friend's discovery, not a database entry", () => {
        render(
            <ActivityPost
                author={{ name: "Alex" }}
                time="2 hours ago"
                text="You have to try this place."
                restaurant={{ name: "Trattoria Verde", cuisine: "Italian" }}
                social={{ ownerName: "Alex", wantCount: 4, interestedNames: ["Alex", "Priya"] }}
                reactions={{
                    liked: false,
                    likeCount: 3,
                    onToggleLike: () => {},
                    commentCount: 2,
                    onComment: () => {},
                    wanted: true,
                    wantCount: 4,
                    onToggleWant: () => {},
                }}
            />,
        )
        expect(screen.getByText("Alex")).toBeInTheDocument()
        expect(screen.getByText("You have to try this place.")).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
    })
})
