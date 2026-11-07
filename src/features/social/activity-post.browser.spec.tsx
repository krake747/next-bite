import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { ActivityPost } from "./activity-post"

describe("ActivityPost", () => {
    test("reads like a friend's discovery, not a database entry", async () => {
        const screen = await render(
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
        await expect.element(screen.getByText("Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("You have to try this place.")).toBeInTheDocument()
        await expect.element(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
    })
})
