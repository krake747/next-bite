import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { toId } from "@api/data.model"

import { RestaurantCardMap } from "./restaurant-card-map"

const { mutateAsync, locationAction } = vi.hoisted(() => {
    const mutateAsync = vi.fn<() => Promise<{ lat: number; lng: number } | null>>()
    return { mutateAsync, locationAction: { mutateAsync } }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        usePlaceLocation: () => locationAction,
    }
})

const placeId = toId<"places">("spec-place-1")

async function renderMap() {
    return render(<RestaurantCardMap placeId={placeId} googlePlaceId="spec-google-id" name="Five Guys" />)
}

describe("RestaurantCardMap", () => {
    test("shows the map once the location resolves", async () => {
        mutateAsync.mockResolvedValueOnce({ lat: 49.6117, lng: 6.13 })
        const screen = await renderMap()
        await screen.getByRole("button", { name: "View on Map" }).click()
        await expect.element(screen.getByText("Click map to get directions")).toBeVisible()
    })

    test("flips a hung lookup to unavailable instead of loading forever", { timeout: 30_000 }, async () => {
        mutateAsync.mockReturnValueOnce(new Promise(() => {}))
        const screen = await renderMap()
        await screen.getByRole("button", { name: "View on Map" }).click()
        await expect.element(screen.getByText("Map unavailable"), { timeout: 20_000 }).toBeVisible()
    })

    test("shows unavailable with retry when the lookup fails, and retry refetches", async () => {
        mutateAsync.mockRejectedValueOnce(new Error("boom"))
        const screen = await renderMap()
        await screen.getByRole("button", { name: "View on Map" }).click()
        await expect.element(screen.getByText("Map unavailable")).toBeVisible()
        expect(mutateAsync).toHaveBeenCalledTimes(1)

        mutateAsync.mockResolvedValueOnce({ lat: 49.6117, lng: 6.13 })
        await screen.getByRole("button", { name: "Retry" }).click()
        await expect.element(screen.getByText("Click map to get directions")).toBeVisible()
        expect(mutateAsync).toHaveBeenCalledTimes(2)
    })
})
