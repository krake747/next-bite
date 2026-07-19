import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
    it("renders children", () => {
        render(<Badge>Hello</Badge>)
        expect(screen.getByText("Hello")).toBeInTheDocument()
    })

    it("renders with primary variant by default", () => {
        render(<Badge>Default</Badge>)
        expect(screen.getByText("Default")).toBeInTheDocument()
    })

    it("renders with gray variant", () => {
        render(<Badge variant="gray">Gray</Badge>)
        const badge = screen.getByText("Gray")
        expect(badge).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<Badge className="custom-class">Styled</Badge>)
        const badge = screen.getByText("Styled")
        expect(badge.className).toContain("custom-class")
    })
})
