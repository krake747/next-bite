import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { RestaurantHeader } from "./restaurant-header"

describe("RestaurantHeader", () => {
    async function renderHeader() {
        return render(
            <RestaurantHeader
                name="Trattoria Verde"
                link="https://example.com/menu"
                ownerName="Alex"
                wantCount={4}
                location="Luxembourg City"
                hasLocation
            />,
        )
    }

    test("shows name, menu, attribution, and location", async () => {
        const screen = await renderHeader()

        await expect.element(screen.getByRole("heading", { name: "Trattoria Verde" })).toBeInTheDocument()
        await expect
            .element(screen.getByRole("link", { name: /Menu/ }))
            .toHaveAttribute("href", "https://example.com/menu")
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
        await expect.element(screen.getByText("Luxembourg City")).toBeInTheDocument()
    })
})
