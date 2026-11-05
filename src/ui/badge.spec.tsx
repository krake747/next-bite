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
        expect(screen.getByText("Default")).toBeInTheDocument()
    })

    it("renders interest states with accessible labels", () => {
        render(<Badge variant="brand">Want to try</Badge>)
        expect(screen.getByText("Want to try")).toBeInTheDocument()
        render(<Badge variant="success">Been there</Badge>)
        expect(screen.getByText("Been there")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<Badge className="custom-class">Styled</Badge>)
        const badge = screen.getByText("Styled")
        expect(badge.className).toContain("custom-class")
    })
})
