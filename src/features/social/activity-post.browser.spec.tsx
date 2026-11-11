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
                ownerName="Alex"
                wantCount={4}
                reactions={{
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
