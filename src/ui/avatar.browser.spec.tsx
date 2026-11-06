import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Avatar } from "./avatar"

describe("Avatar", () => {
    it("marks presence state on the root", () => {
        const { unmount } = render(<Avatar name="Alex" presence />)
        expect(screen.getByText("A").closest('[data-slot="avatar"]')).toHaveAttribute("data-presence", "")
        unmount()
        render(<Avatar name="Alex" />)
        expect(screen.getByText("A").closest('[data-slot="avatar"]')).not.toHaveAttribute("data-presence")
    })
})
