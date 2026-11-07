import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { RestaurantGallery } from "./restaurant-gallery"

const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

describe("RestaurantGallery", () => {
    test("shows the hero with cuisine badge, count button, and viewer", async () => {
        const screen = await render(<RestaurantGallery photos={photos} name="Trattoria Verde" cuisine="Italian" />)
        await expect.element(screen.getByText("Italian").first()).toBeInTheDocument()

        await screen.getByRole("button", { name: /2 photos/ }).click()
        await expect.element(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })

    test("falls back to a cuisine placeholder without photos", async () => {
        const screen = await render(<RestaurantGallery photos={[]} name="Trattoria Verde" cuisine="Italian" />)
        await expect.element(screen.getByText("Italian").first()).toBeInTheDocument()
        await expect.element(screen.getByRole("button", { name: /photos|View/ })).not.toBeInTheDocument()
    })
})
