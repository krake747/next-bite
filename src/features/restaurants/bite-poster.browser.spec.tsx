import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { paintPosterElement } from "@core/poster.utils"

import { BitePosterDialog } from "./bite-poster"

const restaurant = {
    name: "Mama's Dumplings",
    cuisine: "Chinese",
    address: { label: "1 Main St" },
    details: { notes: "Great soup dumplings" },
    ownerName: "Kim",
    rating: 6,
    images: [],
}

describe("BitePosterDialog", () => {
    test("shows the poster details", async () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await render(<BitePosterDialog restaurant={restaurant} show onOpenChange={onOpenChange} />)

        await expect.element(screen.getByText("Mama's Dumplings")).toBeInTheDocument()
        await expect.element(screen.getByText("Great soup dumplings")).toBeInTheDocument()
        await expect.element(screen.getByText("Rated 6 out of 7")).toBeInTheDocument()
    })

    test("pins the panel to the viewport on a long page", async () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await render(
            <>
                <div style={{ height: "5000px" }} />
                <BitePosterDialog restaurant={restaurant} show onOpenChange={onOpenChange} />
            </>,
        )

        const dialog = screen.getByRole("dialog")
        await expect.element(dialog).toBeVisible()
        await expect.element(dialog).toHaveClass(/fixed/)
    })

    test("closes through its callback", async () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await render(<BitePosterDialog restaurant={restaurant} show onOpenChange={onOpenChange} />)

        clickButton(screen.getByRole("button", { name: "Close" }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })
})

// Direct dispatch: the unstyled test env leaves Base UI's inert backdrop above
// the panel, so Playwright hit-testing cannot reach dialog buttons.
function clickButton(button: { element: () => HTMLElement | SVGElement }): void {
    const node = button.element()
    if (!(node instanceof HTMLElement)) {
        throw new TypeError("Button not found")
    }
    node.click()
}

describe("paintPosterElement", () => {
    test("paints through a capable context", () => {
        const drawElementImage = vi.fn<(element: Element, x: number, y: number) => void>()
        const element = document.createElement("div")

        expect(paintPosterElement({ drawElementImage }, element)).toBe(true)
        expect(drawElementImage).toHaveBeenCalledWith(element, 0, 0)
    })

    test("refuses a missing context", () => {
        expect(paintPosterElement(null, document.createElement("div"))).toBe(false)
    })
})
