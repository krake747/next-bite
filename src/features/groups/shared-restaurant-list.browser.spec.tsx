import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SharedRestaurantList } from "./shared-restaurant-list"

const restaurants = [
    { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
    { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
]

describe("SharedRestaurantList", () => {
    test("lists shared restaurants", async () => {
        const screen = await render(<SharedRestaurantList items={restaurants} />)
        await expect.element(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("Sushi Bar")).toBeInTheDocument()
    })

    test("invites sharing when empty", async () => {
        const screen = await render(<SharedRestaurantList items={[]} />)
        await expect.element(screen.getByText(/Share somewhere/)).toBeInTheDocument()
    })
})
