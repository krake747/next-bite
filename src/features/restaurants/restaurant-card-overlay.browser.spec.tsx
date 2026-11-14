import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { toId } from "@api/data.model"
import { type Restaurant } from "@core/restaurants"

import { RestaurantCardOverlay } from "./restaurant-card-overlay"

vi.mock("./restaurant-card-map", () => ({
    RestaurantCardMap: () => (
        <div data-slot="restaurant-card-map-stub">
            <button type="button">View on Map</button>
        </div>
    ),
}))

const mockRestaurant: Restaurant = {
    _id: toId<"places">("spec-place-1"),
    _creationTime: 0,
    ownerId: toId<"profiles">("spec-user-1"),
    ownerName: "Kevin",
    name: "Five Guys",
    cuisine: "Burgers",
    address: { label: "55 Av. de la Gare, 1611 Gare Luxembourg", google: { placeId: "spec-place-id" } },
    note: "Great fries.",
    link: "https://example.com/menu",
    photos: [],
    mySave: null,
    wantCount: 3,
}

describe("RestaurantCardOverlay", () => {
    test("shows name, address, note, and attribution", async () => {
        const screen = await render(<RestaurantCardOverlay restaurant={mockRestaurant} onToggleWant={() => {}} />)
        await expect.element(screen.getByText("Five Guys")).toBeVisible()
        await expect.element(screen.getByText("55 Av. de la Gare, 1611 Gare Luxembourg")).toBeVisible()
        await expect.element(screen.getByText("Great fries.")).toBeVisible()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeVisible()
        await expect.element(attribution).toHaveAttribute("translate", "no")
    })

    test("toggles want and renders the map slot", async () => {
        const onToggleWant = vi.fn<() => void>()
        const screen = await render(
            <RestaurantCardOverlay
                restaurant={mockRestaurant}
                onToggleWant={() => {
                    onToggleWant()
                }}
            />,
        )
        await screen.getByRole("button", { name: /Want to try/ }).click()
        expect(onToggleWant).toHaveBeenCalledTimes(1)
        await expect.element(screen.getByRole("button", { name: "View on Map" })).toBeVisible()
    })
})
