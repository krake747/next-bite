import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { PendingButton } from "./pending-button"

describe("PendingButton", () => {
    it("disables with a spinner while pending", () => {
        render(
            <PendingButton type="submit" pending={true}>
                Sign in
            </PendingButton>,
        )
        const button = screen.getByRole("button", { name: "Sign in" })
        expect(button).toBeDisabled()
        expect(button.getAttribute("aria-busy")).toBe("true")
    })

    it("renders an enabled button when idle", () => {
        render(
            <PendingButton type="submit" pending={false}>
                Sign in
            </PendingButton>,
        )
        const button = screen.getByRole("button", { name: "Sign in" })
        expect(button).not.toBeDisabled()
        expect(button).toHaveAttribute("aria-busy", "false")
    })
})
