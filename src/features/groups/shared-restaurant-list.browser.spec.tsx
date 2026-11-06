import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { SharedRestaurantList } from "./shared-restaurant-list"

const restaurants = [
    { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
    { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
]

describe("SharedRestaurantList", () => {
    test("lists shared spots", () => {
        render(<SharedRestaurantList items={restaurants} />)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("Sushi Bar")).toBeInTheDocument()
    })

    test("invites sharing when empty", () => {
        render(<SharedRestaurantList items={[]} />)
        expect(screen.getByText(/Share somewhere/)).toBeInTheDocument()
    })
})
