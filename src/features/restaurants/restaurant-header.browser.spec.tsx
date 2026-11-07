import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { RestaurantHeader } from "./restaurant-header"

describe("RestaurantHeader", () => {
    async function renderHeader(onShowHours: () => void) {
        return render(
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

    test("shows name, menu, attribution, location, and hours", async () => {
        const screen = await renderHeader(() => {})

        await expect.element(screen.getByRole("heading", { name: "Trattoria Verde" })).toBeInTheDocument()
        await expect
            .element(screen.getByRole("link", { name: /Menu/ }))
            .toHaveAttribute("href", "https://example.com/menu")
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
        await expect.element(screen.getByText("Luxembourg City")).toBeInTheDocument()
    })

    test("opens hours through its callback", async () => {
        const onShowHours = vi.fn<() => void>()
        const screen = await renderHeader(onShowHours)

        await screen.getByRole("button", { name: /Open now/ }).click()
        expect(onShowHours).toHaveBeenCalledTimes(1)
    })
})
