import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { IconButton } from "./icon-button"

describe("IconButton", () => {
    test("names the button from the label", () => {
        render(
            <IconButton label="Close">
                <span>x</span>
            </IconButton>,
        )
        const button = screen.getByRole("button", { name: "Close" })
        expect(button.getAttribute("title")).toBe("Close")
        expect(button.dataset.slot).toBe("icon-button")
    })

    test("prefers an explicit title", () => {
        render(
            <IconButton label="Close" title="Refresh hours">
                <span>x</span>
            </IconButton>,
        )
        expect(screen.getByRole("button", { name: "Close" }).getAttribute("title")).toBe("Refresh hours")
    })

    test("passes disabled through", () => {
        render(
            <IconButton label="Find hours" disabled>
                <span>x</span>
            </IconButton>,
        )
        expect(screen.getByRole("button", { name: "Find hours" })).toBeDisabled()
    })
})
