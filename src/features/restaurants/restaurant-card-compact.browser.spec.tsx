import { beforeEach, describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { toId } from "@api/data.model"
import { type Restaurant } from "@core/restaurants"

import { RestaurantCardCompact } from "./restaurant-card-compact"

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

// The lookup must fire once per tier and then stop. A refetch loop would
// keep firing on every render, which is what took down prod in #260.
async function settleSignals() {
    await new Promise((resolve) => {
        setTimeout(resolve, 500)
    })
    expect(detailsMutate).toHaveBeenCalledTimes(2)
}

const mockRestaurant: Restaurant = {
    _id: toId<"places">("spec-place-2"),
    _creationTime: 0,
    ownerId: toId<"profiles">("spec-user-2"),
    ownerName: "Alexandra",
    name: "Trattoria Verde Antica e Moderna",
    cuisine: "Italian",
    address: { label: "12 Rue de la Boucherie, 1247 Luxembourg Grund" },
    photos: [],
    mySave: "want",
    wantCount: 128,
}

describe("RestaurantCardCompact", () => {
    test("shows name, address, and attribution", async () => {
        const screen = await render(<RestaurantCardCompact restaurant={mockRestaurant} onToggleWant={() => {}} />)
        await expect.element(screen.getByText("Trattoria Verde Antica e Moderna")).toBeVisible()
        await expect.element(screen.getByText("12 Rue de la Boucherie, 1247 Luxembourg Grund")).toBeVisible()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeVisible()
        await expect.element(attribution).toHaveAttribute("translate", "no")
    })

    test("toggles want and links out to directions", async () => {
        const onToggleWant = vi.fn<() => void>()
        const screen = await render(
            <RestaurantCardCompact
                restaurant={mockRestaurant}
                onToggleWant={() => {
                    onToggleWant()
                }}
            />,
        )
        await screen.getByRole("button", { name: /Want to try/ }).click()
        expect(onToggleWant).toHaveBeenCalledTimes(1)
        const directions = screen.getByRole("link", { name: "Get directions" })
        await expect
            .element(directions)
            .toHaveAttribute(
                "href",
                "https://www.google.com/maps/dir/?api=1&destination=12%20Rue%20de%20la%20Boucherie%2C%201247%20Luxembourg%20Grund",
            )
    })

    test("shows price in the eyebrow and open-now status", async () => {
        detailsMutate
            .mockResolvedValueOnce({
                openingHours: { openState: "open", periods: [], weekdayText: [] },
                priceLevel: "PRICE_LEVEL_INEXPENSIVE",
            })
            .mockResolvedValueOnce({})
        const screen = await render(
            <RestaurantCardCompact
                restaurant={{
                    ...mockRestaurant,
                    address: { label: mockRestaurant.address.label, google: { placeId: "spec-place-id" } },
                }}
                onToggleWant={() => {}}
            />,
        )
        await expect.element(screen.getByText("Italian · $")).toBeVisible()
        await expect.element(screen.getByText("Open now")).toBeVisible()
        await settleSignals()
    })
})
