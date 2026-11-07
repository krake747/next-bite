import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { IconButton } from "./icon-button"

describe("IconButton", () => {
    test("names the button from the label", async () => {
        const screen = await render(
            <IconButton label="Close">
                <span>x</span>
            </IconButton>,
        )
        const button = screen.getByRole("button", { name: "Close" })
        await expect.element(button).toHaveAttribute("title", "Close")
        await expect.element(button).toHaveAttribute("data-slot", "icon-button")
    })

    test("prefers an explicit title", async () => {
        const screen = await render(
            <IconButton label="Close" title="Refresh hours">
                <span>x</span>
            </IconButton>,
        )
        await expect.element(screen.getByRole("button", { name: "Close" })).toHaveAttribute("title", "Refresh hours")
    })

    test("passes disabled through", async () => {
        const screen = await render(
            <IconButton label="Find hours" disabled>
                <span>x</span>
            </IconButton>,
        )
        await expect.element(screen.getByRole("button", { name: "Find hours" })).toBeDisabled()
    })
})
