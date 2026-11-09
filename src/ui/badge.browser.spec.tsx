import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { Badge } from "./badge"

describe("Badge", () => {
    test("renders children", async () => {
        const screen = await render(<Badge>Hello</Badge>)
        await expect.element(screen.getByText("Hello")).toBeInTheDocument()
    })

    test("renders with neutral tone by default", async () => {
        const screen = await render(<Badge>Default</Badge>)
        const badge = screen.getByText("Default")
        await expect.element(badge).toHaveAttribute("data-slot", "badge")
        await expect.element(badge).toHaveAttribute("data-variant", "neutral")
    })

    test("renders interest states with accessible labels", async () => {
        const screen = await render(<Badge tone="brand">Want to try</Badge>)
        await expect.element(screen.getByText("Want to try")).toHaveAttribute("data-variant", "brand")
        await screen.unmount()
        const rerendered = await render(<Badge tone="success">Been there</Badge>)
        await expect.element(rerendered.getByText("Been there")).toHaveAttribute("data-variant", "success")
    })

    test("applies custom className", async () => {
        const screen = await render(<Badge className="custom-class">Styled</Badge>)
        const badge = screen.getByText("Styled")
        await expect.element(badge).toHaveClass("custom-class")
    })

    test("exposes slot and variant as data attributes", async () => {
        const screen = await render(<Badge tone="brand">Marked</Badge>)
        const badge = screen.getByText("Marked")
        await expect.element(badge).toHaveAttribute("data-slot", "badge")
        await expect.element(badge).toHaveAttribute("data-variant", "brand")
    })
})
