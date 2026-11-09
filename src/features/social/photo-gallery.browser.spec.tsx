import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { PhotoGallery } from "./photo-gallery"

const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

describe("PhotoGallery", () => {
    test("attributes photos to their authors", async () => {
        const screen = await render(<PhotoGallery photos={photos} />)

        await expect.element(screen.getByText("Alex")).toBeInTheDocument()
    })

    test("opens the viewer on photo activation", async () => {
        const screen = await render(<PhotoGallery photos={photos} />)

        await screen.getByRole("button", { name: /Open photo 1/ }).click()
        await expect.element(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })
})
