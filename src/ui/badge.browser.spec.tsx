import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
    test("renders children", () => {
        render(<Badge>Hello</Badge>)
        expect(screen.getByText("Hello")).toBeInTheDocument()
    })

    test("renders with neutral tone by default", () => {
        render(<Badge>Default</Badge>)
        const badge = screen.getByText("Default")
        expect(badge.dataset.slot).toBe("badge")
        expect(badge.dataset.variant).toBe("neutral")
    })

    test("renders interest states with accessible labels", () => {
        const { unmount } = render(<Badge tone="brand">Want to try</Badge>)
        expect(screen.getByText("Want to try").dataset.variant).toBe("brand")
        unmount()
        render(<Badge tone="success">Been there</Badge>)
        expect(screen.getByText("Been there").dataset.variant).toBe("success")
    })

    test("applies custom className", () => {
        render(<Badge className="custom-class">Styled</Badge>)
        const badge = screen.getByText("Styled")
        expect(badge.className).toContain("custom-class")
    })

    test("exposes slot and variant as data attributes", () => {
        render(<Badge tone="brand">Marked</Badge>)
        const badge = screen.getByText("Marked")
        expect(badge.dataset.slot).toBe("badge")
        expect(badge.dataset.variant).toBe("brand")
    })
})
