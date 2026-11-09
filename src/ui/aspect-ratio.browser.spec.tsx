import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AspectRatio } from "./aspect-ratio"

describe("AspectRatio", () => {
    test("renders children", async () => {
        const screen = await render(
            <AspectRatio ratio={16 / 9}>
                <span>framed content</span>
            </AspectRatio>,
        )
        await expect.element(screen.getByText("framed content")).toBeInTheDocument()
    })

    test("exposes the ratio as a CSS variable", async () => {
        await render(
            <AspectRatio ratio={2 / 1}>
                <span>wide content</span>
            </AspectRatio>,
        )
        const frame = document.querySelector('[data-slot="aspect-ratio"]')
        expect(frame?.getAttribute("style")).toContain("--ratio")
    })
})
