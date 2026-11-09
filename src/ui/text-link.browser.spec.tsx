import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { TextLink } from "./text-link"

describe("TextLink", () => {
    test("renders a plain anchor by default", async () => {
        const screen = await render(<TextLink href="https://example.com">External</TextLink>)
        const link = screen.getByText("External")
        expect(link.element().tagName).toBe("A")
        await expect.element(link).toHaveAttribute("href", "https://example.com")
        await expect.element(link).toHaveAttribute("data-slot", "text-link")
    })

    test("merges styling onto the rendered element", async () => {
        const screen = await render(
            <TextLink render={<a href="/signup" data-testid="router-link" />}>Sign up</TextLink>,
        )
        const link = screen.getByTestId("router-link")
        await expect.element(link).toHaveAttribute("href", "/signup")
        await expect.element(link).toHaveAttribute("data-slot", "text-link")
        await expect.element(screen.getByText("Sign up")).toBeInTheDocument()
    })

    test("applies custom className", async () => {
        const screen = await render(<TextLink className="custom-class">Styled</TextLink>)
        await expect.element(screen.getByText("Styled")).toHaveClass("custom-class")
    })
})
