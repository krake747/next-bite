import { beforeEach, describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { toId } from "@api/data.model"
import { type Restaurant } from "@core/restaurants"

import { RestaurantCardOverlay } from "./restaurant-card-overlay"

const { detailsMutate } = vi.hoisted(() => {
    const detailsMutate = vi.fn<(args: { tier: string }) => Promise<unknown>>()
    return { detailsMutate }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        usePlaceDetails: () => detailsMutate,
    }
})

beforeEach(() => {
    detailsMutate.mockResolvedValue({})
})

// The lookup must fire once and then stop. A refetch loop would
// keep firing on every render, which is what took down prod in #260.
async function settleSignals() {
    await new Promise((resolve) => {
        setTimeout(resolve, 500)
    })
    expect(detailsMutate).toHaveBeenCalledTimes(1)
}

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

    test("toggles want without rendering the map", async () => {
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
        await expect.element(screen.getByRole("button", { name: "View on Map" })).not.toBeInTheDocument()
    })

    test("shows price and open-now signals", async () => {
        detailsMutate.mockResolvedValueOnce({
            openingHours: { openState: "open", periods: [], weekdayText: [] },
            priceLevel: "PRICE_LEVEL_MODERATE",
        })
        const screen = await render(<RestaurantCardOverlay restaurant={mockRestaurant} onToggleWant={() => {}} />)
        await expect.element(screen.getByText("$$")).toBeVisible()
        await expect.element(screen.getByText("Open now")).toBeVisible()
        await settleSignals()
    })

    test("flags permanently closed places", async () => {
        detailsMutate.mockResolvedValueOnce({
            openingHours: { openState: "closed", periods: [], weekdayText: [] },
            businessStatus: "CLOSED_PERMANENTLY",
        })
        const screen = await render(<RestaurantCardOverlay restaurant={mockRestaurant} onToggleWant={() => {}} />)
        await expect.element(screen.getByText("Permanently closed")).toBeVisible()
        await settleSignals()
    })
})
