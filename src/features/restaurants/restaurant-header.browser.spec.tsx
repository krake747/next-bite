import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { RestaurantHeader } from "./restaurant-header"

describe("RestaurantHeader", () => {
    function renderHeader(onShowHours: () => void): void {
        render(
            <RestaurantHeader
                name="Trattoria Verde"
                link="https://example.com/menu"
                ownerName="Alex"
                wantCount={4}
                location="Luxembourg City"
                hasLocation
                openingHours={{
                    openState: "open",
                    periods: [],
                    weekdayText: [
                        "Monday: 9:00 AM – 10:00 PM",
                        "Tuesday: 9:00 AM – 10:00 PM",
                        "Wednesday: 9:00 AM – 10:00 PM",
                        "Thursday: 9:00 AM – 10:00 PM",
                        "Friday: 9:00 AM – 11:00 PM",
                        "Saturday: 10:00 AM – 11:00 PM",
                        "Sunday: 10:00 AM – 9:00 PM",
                    ],
                }}
                onShowHours={onShowHours}
            />,
        )
    }

    test("shows name, menu, attribution, location, and hours", () => {
        renderHeader(() => {})

        expect(screen.getByRole("heading", { name: "Trattoria Verde" })).toBeInTheDocument()
        expect(screen.getByRole("link", { name: /Menu/ })).toHaveAttribute("href", "https://example.com/menu")
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
        expect(screen.getByText("Luxembourg City")).toBeInTheDocument()
    })

    test("opens hours through its callback", async () => {
        const user = userEvent.setup()
        const onShowHours = vi.fn<() => void>()
        renderHeader(onShowHours)

        await user.click(screen.getByRole("button", { name: /Open now/ }))
        expect(onShowHours).toHaveBeenCalledTimes(1)
    })
})
