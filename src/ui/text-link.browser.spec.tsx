import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { TextLink } from "./text-link"

describe("TextLink", () => {
    it("renders a plain anchor by default", () => {
        render(<TextLink href="https://example.com">External</TextLink>)
        const link = screen.getByText("External")
        expect(link.tagName).toBe("A")
        expect(link.getAttribute("href")).toBe("https://example.com")
        expect(link.className).toContain("text-tomato-600")
    })

    it("merges styling onto the rendered element", () => {
        render(<TextLink render={<a href="/signup" data-testid="router-link" />}>Sign up</TextLink>)
        const link = screen.getByTestId("router-link")
        expect(link.getAttribute("href")).toBe("/signup")
        expect(link.dataset.slot).toBe("text-link")
        expect(link.className).toContain("text-tomato-600")
        expect(screen.getByText("Sign up")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<TextLink className="custom-class">Styled</TextLink>)
        expect(screen.getByText("Styled").className).toContain("custom-class")
    })
})
