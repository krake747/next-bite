import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"

import { PhotoGallery } from "./photo-gallery"

const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

describe("PhotoGallery", () => {
    test("attributes photos to their authors", () => {
        render(<PhotoGallery photos={photos} />)

        expect(screen.getByText("Alex")).toBeInTheDocument()
    })

    test("opens the viewer on photo activation", async () => {
        const user = userEvent.setup()
        render(<PhotoGallery photos={photos} />)

        await user.click(screen.getByRole("button", { name: /Open photo 1/ }))
        expect(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })
})
