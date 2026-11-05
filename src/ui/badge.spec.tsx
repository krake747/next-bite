import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
    it("renders children", () => {
        render(<Badge>Hello</Badge>)
        expect(screen.getByText("Hello")).toBeInTheDocument()
    })

    it("renders with neutral variant by default", () => {
        render(<Badge>Default</Badge>)
        const badge = screen.getByText("Default")
        expect(badge).toBeInTheDocument()
        expect(badge.className).toMatch(/stone|neutral|secondary/i)
    })

    it("renders interest states with accessible labels", () => {
        const { unmount } = render(<Badge variant="brand">Want to try</Badge>)
        const want = screen.getByText("Want to try")
        expect(want).toBeInTheDocument()
        expect(want.className).not.toBe("")
        unmount()
        render(<Badge variant="success">Been there</Badge>)
        const been = screen.getByText("Been there")
        expect(been).toBeInTheDocument()
        expect(been.className).not.toBe("")
        expect(been.className).not.toBe(want.className)
    })

    it("applies custom className", () => {
        render(<Badge className="custom-class">Styled</Badge>)
        const badge = screen.getByText("Styled")
        expect(badge.className).toContain("custom-class")
    })
})
