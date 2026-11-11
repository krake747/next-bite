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

    test("exposes the ratio as observed state", async () => {
        const screen = await render(
            <AspectRatio ratio={2 / 1}>
                <span>wide content</span>
            </AspectRatio>,
        )
        const content = screen.getByText("wide content")
        await expect.element(content).toBeInTheDocument()
        const frame = content.element().closest('[data-slot="aspect-ratio"]')
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- closest returns Element, which lacks dataset; getAttribute is the typed API.
        expect(frame?.getAttribute("data-slot")).toBe("aspect-ratio")
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- closest returns Element, which lacks dataset; getAttribute is the typed API.
        expect(frame?.getAttribute("data-ratio")).toBe(String(2 / 1))
    })
})
