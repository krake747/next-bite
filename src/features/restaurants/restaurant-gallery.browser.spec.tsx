import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"

import { RestaurantGallery } from "./restaurant-gallery"

const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

describe("RestaurantGallery", () => {
    test("shows the hero with cuisine badge, count button, and viewer", async () => {
        const user = userEvent.setup()
        render(<RestaurantGallery photos={photos} name="Trattoria Verde" cuisine="Italian" />)
        expect(screen.getByText("Italian")).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: /2 photos/ }))
        expect(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })

    test("falls back to a cuisine placeholder without photos", () => {
        render(<RestaurantGallery photos={[]} name="Trattoria Verde" cuisine="Italian" />)
        expect(screen.getAllByText("Italian").length).toBeGreaterThan(0)
        expect(screen.queryByRole("button", { name: /photos|View/ })).not.toBeInTheDocument()
    })
})
