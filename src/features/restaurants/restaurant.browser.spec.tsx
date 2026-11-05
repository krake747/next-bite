import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RestaurantGallery } from "./restaurant-gallery"
import { RestaurantHeader } from "./restaurant-header"
import { RestaurantInterestButton } from "./restaurant-interest-button"

describe("RestaurantHeader", () => {
    it("shows name, menu, attribution, location, and hours", async () => {
        const user = userEvent.setup()
        const onShowHours = vi.fn<() => void>()
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
        expect(screen.getByRole("heading", { name: "Trattoria Verde" })).toBeInTheDocument()
        expect(screen.getByRole("link", { name: /Menu/ })).toHaveAttribute("href", "https://example.com/menu")
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
        expect(screen.getByText("Luxembourg City")).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: /Open now/ }))
        expect(onShowHours).toHaveBeenCalledTimes(1)
    })
})

describe("RestaurantGallery", () => {
    const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

    it("shows the hero with cuisine badge, count button, and viewer", async () => {
        const user = userEvent.setup()
        render(<RestaurantGallery photos={photos} name="Trattoria Verde" cuisine="Italian" />)
        expect(screen.getByText("Italian")).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: /2 photos/ }))
        expect(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })

    it("falls back to a cuisine placeholder without photos", () => {
        render(<RestaurantGallery photos={[]} name="Trattoria Verde" cuisine="Italian" />)
        expect(screen.queryByRole("button", { name: /photos|View/ })).not.toBeInTheDocument()
    })
})

describe("RestaurantInterestButton", () => {
    it("toggles want-to-try through its callback", async () => {
        const user = userEvent.setup()
        const onToggleWant = vi.fn<() => void>()
        const { rerender } = render(
            <RestaurantInterestButton wanted={false} wantCount={0} onToggleWant={onToggleWant} />,
        )
        const button = screen.getByRole("button", { name: /Want to try/ })
        expect(button).toHaveAttribute("aria-pressed", "false")

        await user.click(button)
        expect(onToggleWant).toHaveBeenCalledTimes(1)

        rerender(<RestaurantInterestButton wanted wantCount={4} onToggleWant={onToggleWant} />)
        expect(screen.getByRole("button", { name: /Want to try/ })).toHaveAttribute("aria-pressed", "true")
        expect(screen.getByText("4")).toBeInTheDocument()
    })
})
